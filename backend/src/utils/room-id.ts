import crypto from 'crypto';

export const generateRoomId = (): string => {
    return crypto.randomBytes(4).toString('hex').substring(0, 6).toUpperCase();
}

export const generateOtp = (): string => {
    return crypto.randomInt(100000, 999999).toString();
};