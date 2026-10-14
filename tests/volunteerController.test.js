import { jest, describe, it, expect, beforeEach } from "@jest/globals";

const mockUserFindById = jest.fn();
const mockDeliveryFind = jest.fn();
const mockDeliveryFindOneAndUpdate = jest.fn();
const mockDeliveryFindOne = jest.fn();
const mockFoodRequestFindByIdAndUpdate = jest.fn();
const mockDonationFindByIdAndUpdate = jest.fn();

jest.unstable_mockModule("../Models/User.js", () => ({
    default: {
        findById: mockUserFindById
    }
}));

jest.unstable_mockModule("../Models/Delivary.js", () => ({
    default: {
        find: mockDeliveryFind,
        findOneAndUpdate: mockDeliveryFindOneAndUpdate,
        findOne: mockDeliveryFindOne
    }
}));

jest.unstable_mockModule("../Models/FoodRequest.js", () => ({
    default: {
        findByIdAndUpdate: mockFoodRequestFindByIdAndUpdate
    }
}));

jest.unstable_mockModule("../Models/Donation.js", () => ({
    default: {
        findByIdAndUpdate: mockDonationFindByIdAndUpdate
    }
}));

const {
    getAvailableDeliveries,
    acceptDelivery,
    cancelDelivery,
    markDeliveryPickedUp,
    markDeliveryDelivered
} = await import("../Controllers/deliveryController.js");

const VOLUNTEER_ID = "vol111111111111111111111111";
const DELIVERY_ID = "del111111111111111111111111";
const FOOD_REQUEST_ID = "req111111111111111111111111";
const DONATION_ID = "don111111111111111111111111";

const makeReq = (overrides = {}) => ({
    user: { userId: VOLUNTEER_ID },
    params: { id: DELIVERY_ID },
    ...overrides
});

const makeRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

const makeDelivery = (overrides = {}) => ({
    _id: DELIVERY_ID,
    status: "ACCEPTED",
    volunteer: VOLUNTEER_ID,
    foodRequest: FOOD_REQUEST_ID,
    donation: DONATION_ID,
    save: jest.fn().mockResolvedValue(true),
    populate: jest.fn().mockResolvedValue(undefined),
    ...overrides
});

const makeFindQuery = (result) => {
    const query = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(result)
    };
    return query;
};

beforeEach(() => {
    jest.clearAllMocks();
    mockUserFindById.mockResolvedValue({
        _id: VOLUNTEER_ID,
        role: "VOLUNTEER"
    });
});

describe("volunteer delivery flow", () => {
    it("lists only unclaimed PENDING deliveries", async () => {
        const deliveries = [makeDelivery({ status: "PENDING", volunteer: null })];
        mockDeliveryFind.mockReturnValue(makeFindQuery(deliveries));

        const res = makeRes();
        await getAvailableDeliveries(makeReq(), res);

        expect(mockDeliveryFind).toHaveBeenCalledWith({
            status: "PENDING",
            volunteer: null
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: true,
                count: 1,
                deliveries
            })
        );
    });

    it("accepts an available delivery and assigns it to the volunteer", async () => {
        const delivery = makeDelivery();
        mockDeliveryFindOneAndUpdate.mockReturnValue({
            populate: jest.fn().mockReturnThis(),
            // The controller chains four populate calls.
            then: (resolve) => resolve(delivery)
        });

        const res = makeRes();
        await acceptDelivery(makeReq(), res);

        expect(mockDeliveryFindOneAndUpdate).toHaveBeenCalledWith(
            {
                _id: DELIVERY_ID,
                status: "PENDING",
                volunteer: null
            },
            {
                $set: expect.objectContaining({
                    volunteer: VOLUNTEER_ID,
                    status: "ACCEPTED",
                    acceptedAt: expect.any(Date)
                })
            },
            { new: true }
        );
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it("moves an accepted delivery directly to IN_TRANSIT on pickup", async () => {
        const delivery = makeDelivery();
        mockDeliveryFindOne.mockResolvedValue(delivery);

        const res = makeRes();
        await markDeliveryPickedUp(makeReq(), res);

        expect(mockDeliveryFindOne).toHaveBeenCalledWith({
            _id: DELIVERY_ID,
            volunteer: VOLUNTEER_ID
        });
        expect(delivery.status).toBe("IN_TRANSIT");
        expect(delivery.pickedUpAt).toEqual(expect.any(Date));
        expect(delivery.save).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it("does not allow pickup unless the delivery was accepted", async () => {
        const delivery = makeDelivery({ status: "PENDING" });
        mockDeliveryFindOne.mockResolvedValue(delivery);

        const res = makeRes();
        await markDeliveryPickedUp(makeReq(), res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(delivery.save).not.toHaveBeenCalled();
    });

    it("allows the assigned volunteer to cancel an ACCEPTED delivery", async () => {
        const delivery = makeDelivery();
        mockDeliveryFindOne.mockResolvedValue(delivery);

        const res = makeRes();
        await cancelDelivery(makeReq(), res);

        expect(mockDeliveryFindOne).toHaveBeenCalledWith({
            _id: DELIVERY_ID,
            volunteer: VOLUNTEER_ID
        });
        expect(delivery.status).toBe("CANCELLED");
        expect(delivery.cancelledAt).toEqual(expect.any(Date));
        expect(delivery.save).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it("does not allow cancellation after pickup", async () => {
        const delivery = makeDelivery({ status: "IN_TRANSIT" });
        mockDeliveryFindOne.mockResolvedValue(delivery);

        const res = makeRes();
        await cancelDelivery(makeReq(), res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(delivery.save).not.toHaveBeenCalled();
    });

    it("marks an IN_TRANSIT delivery DELIVERED and completes related records", async () => {
        const delivery = makeDelivery({ status: "IN_TRANSIT" });
        mockDeliveryFindOne.mockResolvedValue(delivery);
        mockFoodRequestFindByIdAndUpdate.mockResolvedValue({});
        mockDonationFindByIdAndUpdate.mockResolvedValue({});

        const res = makeRes();
        await markDeliveryDelivered(makeReq(), res);

        expect(delivery.status).toBe("DELIVERED");
        expect(delivery.deliveredAt).toEqual(expect.any(Date));
        expect(delivery.save).toHaveBeenCalled();
        expect(mockFoodRequestFindByIdAndUpdate).toHaveBeenCalledWith(
            FOOD_REQUEST_ID,
            {
                $set: expect.objectContaining({
                    status: "COMPLETED",
                    completedAt: expect.any(Date)
                })
            }
        );
        expect(mockDonationFindByIdAndUpdate).toHaveBeenCalledWith(
            DONATION_ID,
            { $set: { status: "COMPLETED" } }
        );
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it("does not complete a delivery before it is IN_TRANSIT", async () => {
        const delivery = makeDelivery({ status: "ACCEPTED" });
        mockDeliveryFindOne.mockResolvedValue(delivery);

        const res = makeRes();
        await markDeliveryDelivered(makeReq(), res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(delivery.save).not.toHaveBeenCalled();
        expect(mockFoodRequestFindByIdAndUpdate).not.toHaveBeenCalled();
        expect(mockDonationFindByIdAndUpdate).not.toHaveBeenCalled();
    });
});
