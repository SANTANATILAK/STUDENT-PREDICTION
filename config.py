import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-portfolio-secret-key-1293847293')
    BASE_DIR = os.path.abspath(os.path.dirname(__file__))
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', f'sqlite:///{os.path.join(BASE_DIR, "portfolio.db")}')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Default Admin Credentials
    ADMIN_USERNAME = os.environ.get('ADMIN_USERNAME', 'admin')
    ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'admin123')
