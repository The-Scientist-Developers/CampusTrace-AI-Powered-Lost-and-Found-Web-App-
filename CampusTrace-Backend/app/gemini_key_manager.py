"""
Gemini API Key Manager with Round-Robin Load Balancing
Distributes requests across multiple API keys to maximize throughput
"""

import google.generativeai as genai
from typing import Optional, List
import threading
from app.config import get_settings

class GeminiKeyManager:
    """
    Manages multiple Gemini API keys with round-robin rotation
    Maximizes RPD (Requests Per Day) by distributing load across keys
    """
    
    def __init__(self):
        self._keys: List[str] = []
        self._current_index = 0
        self._lock = threading.Lock()
        self._models = {}  # Cache models per key
        self._load_keys()
    
    def _load_keys(self):
        """Load API keys from environment dynamically to support any number of keys"""
        settings = get_settings()
        import os
        from dotenv import load_dotenv
        
        # Ensure .env is loaded into os.environ
        load_dotenv()
        
        keys_set = set()
        
        # Add predefined keys from settings
        if getattr(settings, 'GEMINI_API_KEY', None):
            keys_set.add(settings.GEMINI_API_KEY)
        if getattr(settings, 'GEMINI_API_KEY_2', None):
            keys_set.add(settings.GEMINI_API_KEY_2)
        if getattr(settings, 'GEMINI_API_KEY_3', None):
            keys_set.add(settings.GEMINI_API_KEY_3)
            
        # Dynamically scan os.environ for any variable starting with GEMINI_API_KEY
        for env_key, env_val in os.environ.items():
            if env_key.startswith('GEMINI_API_KEY') and env_val and env_val.strip():
                keys_set.add(env_val.strip())
                
        self._keys = list(keys_set)
        
        if not self._keys:
            print("⚠️ No Gemini API keys found!")
        else:
            print(f"✅ Loaded {len(self._keys)} Gemini API key(s) for round-robin")
            print(f"📊 Estimated capacity: {len(self._keys) * 1500} RPD (15 RPM per key)")
    
    def get_next_key(self) -> Optional[str]:
        """
        Get the next API key in round-robin fashion
        Thread-safe implementation
        """
        if not self._keys:
            return None
        
        with self._lock:
            key = self._keys[self._current_index]
            self._current_index = (self._current_index + 1) % len(self._keys)
            return key
    
    def get_model(self, model_name: str = "gemini-2.5-flash") -> Optional[genai.GenerativeModel]:
        """
        Get a Gemini model instance with the next API key
        Uses Gemini 2.5 Flash - the latest and most capable model
        Returns None if no keys available
        """
        key = self.get_next_key()
        if not key:
            return None
        
        # Check if we have a cached model for this key
        cache_key = f"{key[:10]}_{model_name}"
        
        if cache_key not in self._models:
            try:
                genai.configure(api_key=key)
                self._models[cache_key] = genai.GenerativeModel(model_name)
                print(f"🔧 Created model with key ending in ...{key[-4:]}")
            except Exception as e:
                print(f"❌ Failed to create model with key: {e}")
                return None
        
        return self._models[cache_key]
    
    def get_key_count(self) -> int:
        """Get the number of available API keys"""
        return len(self._keys)
    
    def get_current_key_index(self) -> int:
        """Get the current key index (for debugging)"""
        with self._lock:
            return self._current_index
    
    def get_stats(self) -> dict:
        """Get statistics about key usage"""
        return {
            "total_keys": len(self._keys),
            "current_index": self._current_index,
            "estimated_rpm": len(self._keys) * 15,  # 15 RPM per key
            "estimated_rpd": len(self._keys) * 1500,  # 1500 RPD per key
        }


# Global instance
_key_manager: Optional[GeminiKeyManager] = None


def get_key_manager() -> GeminiKeyManager:
    """Get or create the global key manager instance"""
    global _key_manager
    if _key_manager is None:
        _key_manager = GeminiKeyManager()
    return _key_manager


def get_gemini_model(model_name: str = "gemini-2.5-flash") -> Optional[genai.GenerativeModel]:
    """
    Convenience function to get a Gemini model with round-robin key selection
    Uses Gemini 2.5 Flash - the latest and most capable model
    
    Usage:
        model = get_gemini_model()
        if model:
            response = await model.generate_content_async("Hello")
    """
    manager = get_key_manager()
    return manager.get_model(model_name)
