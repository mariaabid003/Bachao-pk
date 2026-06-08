"""Firebase Admin SDK initialisation with graceful fallback."""
import logging
import os
try:
    import firebase_admin
    from firebase_admin import credentials, firestore
except ImportError:
    firebase_admin = None
    credentials = None
    firestore = None

logger = logging.getLogger(__name__)
_initialized = False
_init_error: str = ""


def _init():
    global _initialized, _init_error
    if _initialized:
        return
    if firebase_admin is None:
        _init_error = "firebase-admin is not installed"
        logger.warning("Firebase unavailable (%s); running in offline/demo mode", _init_error)
        return

    try:
        cred_path = os.getenv("FIREBASE_CREDENTIAL_PATH", "")
        if cred_path and os.path.exists(cred_path):
            cred = credentials.Certificate(cred_path)
        else:
            cred_dict = {
                "type": "service_account",
                "project_id": os.getenv("FIREBASE_PROJECT_ID"),
                "private_key": os.getenv("FIREBASE_PRIVATE_KEY", "").replace("\\n", "\n"),
                "client_email": os.getenv("FIREBASE_CLIENT_EMAIL"),
                "token_uri": "https://oauth2.googleapis.com/token",
            }
            # Only attempt Firebase init if credentials look real
            if not cred_dict["project_id"] or not cred_dict["client_email"]:
                raise ValueError("Firebase credentials not configured in .env")
            cred = credentials.Certificate(cred_dict)

        firebase_admin.initialize_app(cred)
        _initialized = True
        logger.info("Firebase Admin SDK initialized successfully")

    except Exception as e:
        _init_error = str(e)
        logger.warning(f"Firebase unavailable ({e}); running in offline/demo mode")


# Attempt init at import — errors are caught and logged, never raised
_init()


class _FallbackDB:
    """Stub Firestore client used when Firebase is unavailable."""
    def collection(self, name):
        return _FallbackCollection(name)


class _FallbackCollection:
    def __init__(self, name): self._name = name
    def document(self, doc_id): return _FallbackDoc(self._name, doc_id)
    def add(self, data): return (None, None)
    def stream(self): return iter([])

class _FallbackDoc:
    def __init__(self, col, doc_id):
        self._col, self._id = col, doc_id
    def set(self, data, **kw):   raise ConnectionError("Firebase not configured")
    def get(self):               return _FallbackSnap()
    def update(self, data):      raise ConnectionError("Firebase not configured")

class _FallbackSnap:
    exists = False
    def to_dict(self): return {}


# Expose db — real Firestore client if init succeeded, stub otherwise
try:
    db = firestore.client() if _initialized else _FallbackDB()
except Exception:
    db = _FallbackDB()
