import h5py
import json
import os

# Paths
MODEL_PATH = "model/crop_disease_model.h5"
FIXED_MODEL_PATH = "model/crop_disease_model_fixed.h5"

def fix_model_config():
    if not os.path.exists(MODEL_PATH):
        print(f"Error: Model file not found at {MODEL_PATH}")
        return

    print(f"Processing {MODEL_PATH}...")
    
    # Copy file to new location first
    with open(MODEL_PATH, 'rb') as f_in:
        with open(FIXED_MODEL_PATH, 'wb') as f_out:
            f_out.write(f_in.read())
            
    try:
        with h5py.File(FIXED_MODEL_PATH, 'r+') as f:
            if 'model_config' not in f.attrs:
                print("Error: 'model_config' attribute not found in H5 file.")
                return

            # Read config
            config_str = f.attrs['model_config']
            if isinstance(config_str, bytes):
                config_str = config_str.decode('utf-8')
            
            config = json.loads(config_str)
            
            # Recursive function to remove quantization_config
            def remove_quantization_config(item):
                if isinstance(item, dict):
                    if 'quantization_config' in item:
                        print("Removing 'quantization_config' from layer config")
                        del item['quantization_config']
                    for key, value in item.items():
                        remove_quantization_config(value)
                elif isinstance(item, list):
                    for i in item:
                        remove_quantization_config(i)

            # Apply fix
            remove_quantization_config(config)
            
            # Save back
            new_config_str = json.dumps(config).encode('utf-8')
            f.attrs['model_config'] = new_config_str
            print(f"Successfully fixed model config. Saved to {FIXED_MODEL_PATH}")

    except Exception as e:
        print(f"Failed to fix model: {e}")
        # Cleanup if failed
        if os.path.exists(FIXED_MODEL_PATH):
            os.remove(FIXED_MODEL_PATH)

if __name__ == "__main__":
    fix_model_config()
