"""
Utility functions for generating URL slugs
"""

import re
import unicodedata


def slugify(text: str) -> str:
    """
    Convert a string to a URL-friendly slug.
    
    Example:
        slugify("My Event Title!") -> "my-event-title"
        slugify("CTF Challenge 2024") -> "ctf-challenge-2024"
    """
    # Convert to lowercase
    text = text.lower()
    
    # Remove diacritics (accents)
    text = unicodedata.normalize('NFKD', text)
    text = text.encode('ascii', 'ignore').decode('ascii')
    
    # Replace spaces and underscores with dashes
    text = re.sub(r'[\s_]+', '-', text)
    
    # Remove all non-alphanumeric characters except dashes
    text = re.sub(r'[^\w\-]+', '', text)
    
    # Replace multiple consecutive dashes with a single dash
    text = re.sub(r'-+', '-', text)
    
    # Remove leading and trailing dashes
    text = text.strip('-')
    
    return text

