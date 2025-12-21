import ItemLibrary from '../models/ItemLibrary.js';
import TeaItem from '../models/TeaItem.js';

// @desc    Get all library templates
// @route   GET /api/library
// @access  Private
export const getAllTemplates = async (req, res, next) => {
  try {
    const templates = await ItemLibrary.find()
      .sort({ usageCount: -1, createdAt: -1 })
      .populate('createdBy', 'email');

    res.status(200).json({
      success: true,
      count: templates.length,
      data: templates
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single template
// @route   GET /api/library/:id
// @access  Private
export const getTemplate = async (req, res, next) => {
  try {
    const template = await ItemLibrary.findById(req.params.id)
      .populate('createdBy', 'email');

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    res.status(200).json({
      success: true,
      data: template
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new template
// @route   POST /api/library
// @access  Private
export const createTemplate = async (req, res, next) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      console.warn('[Library] [createTemplate] Empty request body');
      return res.status(400).json({
        success: false,
        message: 'Template data is required'
      });
    }

    const templateData = {
      ...req.body,
      createdBy: req.admin.id
    };

    let template;
    try {
      template = await ItemLibrary.create(templateData);
    } catch (createError) {
      console.error('[Library] [createTemplate] Failed to create template:', createError.message);
      if (createError.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          message: 'Invalid template data'
        });
      }
      throw createError;
    }

    console.info('[Library] [createTemplate] Template created:', template._id);
    res.status(201).json({
      success: true,
      data: template
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update template
// @route   PUT /api/library/:id
// @access  Private
export const updateTemplate = async (req, res, next) => {
  try {
    const template = await ItemLibrary.findById(req.params.id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    const updatedTemplate = await ItemLibrary.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      data: updatedTemplate
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete template
// @route   DELETE /api/library/:id
// @access  Private
export const deleteTemplate = async (req, res, next) => {
  try {
    const template = await ItemLibrary.findById(req.params.id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    await template.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Template deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create tea item from template
// @route   POST /api/library/:id/create
// @access  Private
export const createTeaItemFromTemplate = async (req, res, next) => {
  try {
    let template;
    try {
      template = await ItemLibrary.findById(req.params.id);
    } catch (dbError) {
      console.error('[Library] [createTeaItem] Database error:', dbError.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve template'
      });
    }

    if (!template) {
      console.warn('[Library] [createTeaItem] Template not found:', req.params.id);
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    // Use customizations from request body or defaults from template
    let teaItem;
    try {
      teaItem = await template.createTeaItem(req.body);
    } catch (itemError) {
      console.error('[Library] [createTeaItem] Failed to create tea item:', itemError.message);
      if (itemError.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          message: 'Invalid tea item data'
        });
      }
      return res.status(500).json({
        success: false,
        message: 'Failed to create tea item from template'
      });
    }

    // Emit WebSocket event
    const io = req.app.get('io');
    if (io) {
      try {
        io.emit('teaItem:created', teaItem);
      } catch (wsError) {
        console.error('[Library] [createTeaItem] WebSocket broadcast failed:', wsError.message);
        // Don't fail response for broadcast error
      }
    }

    console.info('[Library] [createTeaItem] Tea item created from template:', teaItem._id);
    res.status(201).json({
      success: true,
      data: teaItem,
      message: 'Tea item created from template successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get most used templates
// @route   GET /api/library/popular
// @access  Private
export const getMostUsedTemplates = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const templates = await ItemLibrary.getMostUsed(limit);

    res.status(200).json({
      success: true,
      count: templates.length,
      data: templates
    });
  } catch (error) {
    next(error);
  }
};
