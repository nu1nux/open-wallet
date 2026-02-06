/**
 * Password strength levels
 */
export enum PasswordStrength {
  VERY_WEAK = 'very_weak',
  WEAK = 'weak',
  FAIR = 'fair',
  STRONG = 'strong',
  VERY_STRONG = 'very_strong',
}

/**
 * Password check result
 */
export interface PasswordCheckResult {
  strength: PasswordStrength;
  score: number; // 0-100
  feedback: string[];
  isAcceptable: boolean;
}

/**
 * Common passwords to reject (subset of common list)
 */
const COMMON_PASSWORDS = new Set([
  'password',
  'password1',
  'password123',
  '123456',
  '12345678',
  '123456789',
  'qwerty',
  'abc123',
  'letmein',
  'welcome',
  'monkey',
  'dragon',
  'master',
  'login',
  'admin',
  'iloveyou',
  'sunshine',
  'princess',
  'football',
  'baseball',
  'trustno1',
]);

/**
 * Check password strength
 */
export function checkPassword(password: string): PasswordCheckResult {
  const feedback: string[] = [];
  let score = 0;

  // Length checks
  if (password.length < 8) {
    feedback.push('Password must be at least 8 characters');
  } else if (password.length < 12) {
    score += 10;
    feedback.push('Consider using 12+ characters for better security');
  } else if (password.length < 16) {
    score += 20;
  } else {
    score += 30;
  }

  // Character variety checks
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);

  if (hasLower) score += 10;
  if (hasUpper) score += 10;
  if (hasDigit) score += 10;
  if (hasSpecial) score += 15;

  if (!hasLower && !hasUpper) {
    feedback.push('Add letters for stronger password');
  }
  if (!hasDigit) {
    feedback.push('Add numbers for stronger password');
  }
  if (!hasSpecial) {
    feedback.push('Add special characters (!@#$%...) for stronger password');
  }

  // Check for common patterns
  if (/^[a-zA-Z]+$/.test(password)) {
    score -= 10;
    feedback.push('Avoid using only letters');
  }
  if (/^[0-9]+$/.test(password)) {
    score -= 20;
    feedback.push('Avoid using only numbers');
  }
  if (/(.)\1{2,}/.test(password)) {
    score -= 10;
    feedback.push('Avoid repeated characters');
  }
  if (/^(abc|123|qwe|asd)/i.test(password)) {
    score -= 15;
    feedback.push('Avoid common patterns like "abc" or "123"');
  }

  // Check against common passwords
  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    score = 0;
    feedback.push('This is a commonly used password - please choose another');
  }

  // Determine strength
  score = Math.max(0, Math.min(100, score));

  let strength: PasswordStrength;
  if (score < 20) {
    strength = PasswordStrength.VERY_WEAK;
  } else if (score < 40) {
    strength = PasswordStrength.WEAK;
  } else if (score < 60) {
    strength = PasswordStrength.FAIR;
  } else if (score < 80) {
    strength = PasswordStrength.STRONG;
  } else {
    strength = PasswordStrength.VERY_STRONG;
  }

  // Minimum requirements for wallet
  const isAcceptable =
    password.length >= 8 &&
    !COMMON_PASSWORDS.has(password.toLowerCase()) &&
    score >= 40;

  return {
    strength,
    score,
    feedback,
    isAcceptable,
  };
}

/**
 * Get strength label for display
 */
export function getStrengthLabel(strength: PasswordStrength): string {
  switch (strength) {
    case PasswordStrength.VERY_WEAK:
      return 'Very Weak';
    case PasswordStrength.WEAK:
      return 'Weak';
    case PasswordStrength.FAIR:
      return 'Fair';
    case PasswordStrength.STRONG:
      return 'Strong';
    case PasswordStrength.VERY_STRONG:
      return 'Very Strong';
  }
}

/**
 * Get strength color for UI
 */
export function getStrengthColor(strength: PasswordStrength): string {
  switch (strength) {
    case PasswordStrength.VERY_WEAK:
      return '#ff4444';
    case PasswordStrength.WEAK:
      return '#ff8800';
    case PasswordStrength.FAIR:
      return '#ffcc00';
    case PasswordStrength.STRONG:
      return '#88cc00';
    case PasswordStrength.VERY_STRONG:
      return '#00cc44';
  }
}

/**
 * Generate a random strong password
 */
export function generateStrongPassword(length = 16): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const digits = '0123456789';
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  const all = lowercase + uppercase + digits + special;

  let password = '';

  // Ensure at least one of each type
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += digits[Math.floor(Math.random() * digits.length)];
  password += special[Math.floor(Math.random() * special.length)];

  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }

  // Shuffle
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
}
