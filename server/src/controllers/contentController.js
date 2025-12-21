import { Content } from '../models/index.js';
import { broadcastContentUpdate } from '../websocket/handlers.js';

// GET /api/content - public
export const getContent = async (req, res, next) => {
  try {
    const content = await Content.getCurrentContent();
    res.status(200).json({ success: true, data: content });
  } catch (error) {
    next(error);
  }
};

// PUT /api/admin/content - admin only
export const updateContent = async (req, res, next) => {
  try {
    const { aboutTitle, aboutDescription, contactPhone, contactEmail, contactAddress } = req.body || {};

    if ([aboutTitle, aboutDescription, contactPhone, contactEmail, contactAddress].every((v) => v === undefined)) {
      return res.status(400).json({ success: false, message: 'At least one field is required' });
    }

    const content = await Content.getCurrentContent();

    if (aboutTitle !== undefined) content.aboutTitle = String(aboutTitle).trim();
    if (aboutDescription !== undefined) content.aboutDescription = String(aboutDescription).trim();
    if (contactPhone !== undefined) content.contactPhone = String(contactPhone).trim();
    if (contactEmail !== undefined) {
      const emailVal = String(contactEmail).trim();
      if (emailVal && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
        return res.status(400).json({ success: false, message: 'Invalid contact email' });
      }
      content.contactEmail = emailVal;
    }
    if (contactAddress !== undefined) content.contactAddress = String(contactAddress).trim();

    try {
      await content.save();
    } catch (error) {
      console.error('[Content] [update] Save error:', error.message);
      return res.status(500).json({ success: false, message: 'Failed to update content' });
    }

    const io = req.app.get('io');
    if (io) {
      broadcastContentUpdate(io, content);
    }

    res.status(200).json({ success: true, data: content, message: 'Content updated' });
  } catch (error) {
    next(error);
  }
};
