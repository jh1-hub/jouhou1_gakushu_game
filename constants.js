export const GRAVITY = 9.8; // m/s^2
export const TIME_STEP = 1 / 60; // 60 FPS
export const RESTITUTION = 0.6; // Bounciness factor
// Fixed horizontal friction. 
// Calculated as 0.5 + (Run / 100). For Run=3, FRICTION = 0.53.
// Lower value = Higher friction (stops faster).
export const FRICTION = 0.53; 
export const WIND_FACTOR = 0.5; // Multiplier for wind force
export const VELOCITY_STOP_THRESHOLD = 0.5; // Stop if velocity is low
export const HEIGHT_STOP_THRESHOLD = 0.1; // Stop if near ground
export const MAX_BOUNCES = 3; // Maximum allowed bounces before forced rolling