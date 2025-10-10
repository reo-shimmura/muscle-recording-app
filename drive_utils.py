import streamlit as st
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload
from google.oauth2 import service_account
import io

@st.cache_resource(show_spinner=False)
def get_drive_service():
    creds_info = st.secrets["gcp_service_account"]
    creds = service_account.Credentials.from_service_account_info(
        creds_info,
        scopes=["https://www.googleapis.com/auth/drive.file"]
    )
    return build("drive", "v3", credentials=creds)

def upload_image_to_drive(file, filename):
    """画像をGoogle Driveにアップロードし、共有URLを返す"""
    drive_service = get_drive_service()
    folder_id = st.secrets["google_drive"]["folder_id"]

    file_bytes = file.read()
    file_io = io.BytesIO(file_bytes)
    media = MediaIoBaseUpload(file_io, mimetype=file.type)

    file_metadata = {"name": filename, "parents": [folder_id]}
    uploaded = drive_service.files().create(
        body=file_metadata,
        media_body=media,
        fields="id"
    ).execute()

    file_id = uploaded.get("id")

    # 誰でも閲覧できるようにする
    drive_service.permissions().create(
        fileId=file_id,
        body={"type": "anyone", "role": "reader"},
    ).execute()

    return f"https://drive.google.com/uc?id={file_id}"

