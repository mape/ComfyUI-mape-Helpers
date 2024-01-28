"""
@author: mape
@title: mape's helpers
@nickname: 🟡 mape's helpers
@version: 0.1
@description: Various QoL improvements like prompt tweaking, variable assignment, image preview, fuzzy search, error reporting, organizing and node navigation.
"""

class MapeVariable():
    OUTPUT_NODE = True
    FUNCTION = "func"
    CATEGORY = "mape"
    RETURN_TYPES = ()

    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "name": ("STRING", {"name": ""}),
            },
            "optional": {
                "*": ("*", {}),
            },
            "hidden": {"id": "UNIQUE_ID"},
        }

    RETURN_TYPES = ("*",)

NODE_CLASS_MAPPINGS = { "mape Variable": MapeVariable }

WEB_DIRECTORY = "./js"

__all__ = ["NODE_CLASS_MAPPINGS", "WEB_DIRECTORY"]
