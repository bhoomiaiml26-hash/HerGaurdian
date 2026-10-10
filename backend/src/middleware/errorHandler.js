const errorHandler = (err, req, res, next) => {
  console.error(`[ErrorHandler] ${err.name || 'Error'}: ${err.message}`);

  if (err.code === 'P2002') {
    const target = Array.isArray(err.meta?.target) ? err.meta.target.join(', ') : 'field';
    return res.status(409).json({
      success: false,
      status: 'error',
      message: `A record with this ${target} already exists.`,
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      status: 'error',
      message: 'Record not found.',
    });
  }

  res.status(err.statusCode || 500).json({
    status: 'error',
    message: err.message || 'Internal Server Error',
  });
};

export default errorHandler;
