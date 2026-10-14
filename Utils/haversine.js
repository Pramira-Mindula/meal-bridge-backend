// ============================================================
// haversine.js
//
// Calculates straight-line distance between two geo-coordinates
// using the Haversine formula.
//
// Returns distance in kilometres, rounded to 2 decimal places.
// Returns null if any coordinate is missing or invalid.
// ============================================================

/**
 * @param {number} lat1
 * @param {number} lon1
 * @param {number} lat2
 * @param {number} lon2
 * @returns {number|null} distance in km, or null
 */
export const haversineDistance = (lat1, lon1, lat2, lon2) => {
    if (
        lat1 == null || lon1 == null ||
        lat2 == null || lon2 == null
    ) {
        return null;
    }

    const R = 6371; // Earth radius in km
    const toRad = (deg) => (deg * Math.PI) / 180;

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) *
            Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(R * c * 100) / 100;
};
