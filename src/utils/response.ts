export const successResponse = <T>(data: T, message?: string) => {
  return {
    success: true,
    data,
    ...(message && { message }),
  };
};

export const errorResponse = (message: string, code?: string, details?: any) => {
  return {
    success: false,
    error: message,
    ...(code && { code }),
    ...(details && { details }),
  };
};