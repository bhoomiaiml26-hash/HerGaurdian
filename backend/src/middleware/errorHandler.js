const errorHandler = (err, req, res, next) => {
  // Avoid leaking sensitive request bodies while logging diagnostic stack
  console.error(`[ErrorHandler] ${err.name || 'Error'}: ${err.message}`);

  // Handle Mongoose Validation Errors
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors || {})
      .map((e) => e.message)
      .filter(Boolean);

    return res.status(400).json({
      success: false,
      status: 'error',
      message:
        messages.length > 0
          ? messages.join('. ')
          : 'Validation failed. Please verify your submitted details.',
    });
  }

  // Handle Mongoose Cast Errors (e.g. invalid MongoDB ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      status: 'error',
      message: 'Invalid identifier format.',
    });
  }

  res.status(err.statusCode || 500).json({
    status: 'error',
    message: err.message || 'Internal Server Error',
  });
};

export default errorHandler;
