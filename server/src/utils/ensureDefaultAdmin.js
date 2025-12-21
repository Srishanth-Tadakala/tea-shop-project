import Admin from '../models/Admin.js';

const DEFAULT_ADMIN = {
  email: 'admin112233@gmail.com',
  password: 'admin@#$12345',
  role: 'admin'
};

export const ensureDefaultAdmin = async () => {
  const existing = await Admin.findOne({ email: DEFAULT_ADMIN.email }).select('+password');

  if (existing) {
    // Reactivate if it exists but is inactive
    if (!existing.isActive) {
      existing.isActive = true;
      await existing.save({ validateBeforeSave: false });
    }
    // Ensure default admin credentials remain valid (repairs any prior double-hash)
    const matchesDefault = await existing.matchPassword(DEFAULT_ADMIN.password);
    if (!matchesDefault) {
      existing.password = DEFAULT_ADMIN.password;
      await existing.save();
    }
    return { created: false, email: existing.email };
  }

  const admin = await Admin.create(DEFAULT_ADMIN);
  return { created: true, email: admin.email };
};
