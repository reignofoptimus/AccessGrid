import io
import warnings
from flask import request, abort
from PIL import Image, UnidentifiedImageError


def read_image():
    file=request.files.get('image')
    if not file or file.mimetype not in {'image/jpeg','image/png'}:
        abort(400,description='Upload a JPEG or PNG image')
    raw=file.read(8*1024*1024+1)
    if len(raw)>8*1024*1024:
        abort(413,description='Image exceeds 8 MB')
    try:
        with warnings.catch_warnings():
            warnings.simplefilter('error',Image.DecompressionBombWarning)
            with Image.open(io.BytesIO(raw)) as image:
                if image.format not in {'JPEG','PNG'} or image.width*image.height>12_000_000 or getattr(image,'n_frames',1)!=1:
                    abort(400,description='Unsupported image dimensions or format')
                image.verify()
            with Image.open(io.BytesIO(raw)) as image:
                return image.convert('RGB').copy()
    except (UnidentifiedImageError,OSError,ValueError,Image.DecompressionBombWarning,Image.DecompressionBombError):
        abort(400,description='Invalid image content')
