const TECHNICAL_PATTERNS = [
  /ECONNREFUSED/i,
  /Network Error/i,
  /ERR_NETWORK/i,
  /timeout/i,
  /Mongo(ServerSelection)?Error/i,
  /buffering timed out/i,
  /E11000/i,
  /Cast to ObjectId/i,
  /jwt malformed/i,
  /secretOrPrivateKey/i,
  /Cannot read propert/i,
  /Unexpected token/i,
];

function looksTechnical(message) {
  if (!message || typeof message !== 'string') return false;
  return TECHNICAL_PATTERNS.some((re) => re.test(message));
}

function validationMessages(data) {
  if (!data?.errors?.length) return '';
  return data.errors
    .map((e) => (typeof e === 'string' ? e : e.message))
    .filter(Boolean)
    .join(' ');
}

/**
 * Turn API / network failures into short, user-facing copy.
 */
export function getFriendlyErrorMessage(err, fallback = 'Something went wrong. Please try again.') {
  if (!err) return fallback;

  if (!err.response) {
    if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
      return "We couldn't reach the server. Check that the app is running and try again.";
    }
    if (looksTechnical(err.message)) {
      return fallback;
    }
    return err.message || fallback;
  }

  const { status, data } = err.response;
  const serverMessage = data?.message || validationMessages(data);

  if (status === 401) {
    return serverMessage && !looksTechnical(serverMessage)
      ? serverMessage
      : 'Email or password is incorrect. Please try again.';
  }
  if (status === 403) {
    return serverMessage && !looksTechnical(serverMessage)
      ? serverMessage
      : "You don't have permission to do that.";
  }
  if (status === 404) {
    return serverMessage && !looksTechnical(serverMessage)
      ? serverMessage
      : "We couldn't find what you were looking for.";
  }
  if (status === 400) {
    if (serverMessage && !looksTechnical(serverMessage)) return serverMessage;
    return 'Please check your input and try again.';
  }
  if (status >= 500) {
    return 'Something went wrong on our end. Please try again in a moment.';
  }

  if (serverMessage && !looksTechnical(serverMessage)) return serverMessage;
  return fallback;
}
