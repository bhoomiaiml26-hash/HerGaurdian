from dotenv import load_dotenv
import os

load_dotenv()

from ibm_watsonx_ai import Credentials
from ibm_watsonx_ai.foundation_models import ModelInference

print("URL:", os.getenv("IBM_WATSONX_URL"))
print("PROJECT:", os.getenv("IBM_PROJECT_ID"))

credentials = Credentials(
    url=os.getenv("IBM_WATSONX_URL"),
    api_key=os.getenv("IBM_API_KEY"),
)

model = ModelInference(
    model_id="meta-llama/llama-3-3-70b-instruct",
    credentials=credentials,
    project_id=os.getenv("IBM_PROJECT_ID"),
)

response = model.generate_text("Say Hello")

print(response)