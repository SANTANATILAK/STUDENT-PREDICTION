from app import app
from models import db, User, Skill, Product, Post, Comment, Task
import datetime

def seed_database():
    print("Seeding database...")
    
    # 1. Create/Recreate Tables
    db.drop_all()
    db.create_all()
    
    # 2. Add Users
    admin = User(username='admin', role='admin')
    admin.set_password('admin123')
    
    test_user = User(username='testuser', role='user')
    test_user.set_password('test1234')
    
    db.session.add(admin)
    db.session.add(test_user)
    db.session.commit()
    
    # 3. Add Studio Equipment & Gear (Rebranded from Skills)
    skills_data = [
        # Cameras
        ('RED Komodo 6K Cinema', 'Cameras', 98),
        ('Sony FX3 Full-Frame', 'Cameras', 95),
        ('DJI Inspire 3 Drone', 'Cameras', 90),
        ('Leica M11 Rangefinder', 'Cameras', 85),
        # Lenses
        ('Zeiss Supreme Prime Set', 'Lenses', 96),
        ('Leica Summilux-M Set', 'Lenses', 92),
        ('Sony G-Master Zoom Series', 'Lenses', 90),
        # Rigging
        ('Tilta Hydra Arm Car Mount', 'Rigging', 95),
        ('DJI Ronin 2 Stabilizer', 'Rigging', 90),
        ('Freefly Movi Pro Rig', 'Rigging', 85),
        # Lighting
        ('Profoto Pro-11 Studio Pack', 'Lighting', 95),
        ('Aputure 600d Pro Light', 'Lighting', 92),
        ('Astera Titan Tubes Set', 'Lighting', 88)
    ]
    for name, cat, prof in skills_data:
        skill = Skill(name=name, category=cat, proficiency=prof)
        db.session.add(skill)
        
    # 4. Add Active Client Shoots for testuser (Rebranded from Tasks)
    tasks_data = [
        ('Aventador SVJ Sunset Session', 'Mumbai golden hour rolling shots & night cityscape cinematics. Status: Delivered.', 'Completed'),
        ('Ducati Panigale V4S Trackday', 'BIC Circuit high-speed action tracking and 4K cornering reels. Status: In Post-Production.', 'Pending'),
        ('Porsche 911 GT3 RS Studio Shoot', 'Warehouse studio session highlighting custom golden wheels. Status: Delivered.', 'Completed'),
        ('AMG GT 63 S Rain Cinematic', 'Wet highway tracking shots and slow-motion reflections. Status: Planning.', 'Pending')
    ]
    for title, desc, status in tasks_data:
        task = Task(user_id=test_user.id, title=title, description=desc, status=status)
        db.session.add(task)
        
    # 5. Add Fine Art Prints & Presets (Rebranded from Products)
    products_data = [
        ('Matte Black Huracán STO Metal Print', 'Premium dye-sublimation print on a sleek aluminum sheet with high-gloss finish. Delivered ready-to-hang with floating rear mount. Size: 24x36 inches.', 299.00, 'Metal Prints', 
         '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" class="prod-svg"><rect x="15" y="15" width="70" height="70" rx="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M25 60 C35 55, 45 45, 75 45 L75 55 L25 60 Z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="35" cy="58" r="6" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="65" cy="55" r="6" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>'),
        
        ('Ducati Panigale V4S Acrylic Print', 'Fine-art gallery grade print face-mounted under 1/4-inch polished acrylic glass. Offers stunning optical depth, vivid gold tones, and shatterproof durability. Size: 20x30 inches.', 349.00, 'Acrylic Prints',
         '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" class="prod-svg"><rect x="15" y="15" width="70" height="70" rx="4" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="30" cy="60" r="10" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="70" cy="60" r="10" fill="none" stroke="currentColor" stroke-width="2"/><path d="M30 60 L45 40 L60 40 L70 60" fill="none" stroke="currentColor" stroke-width="2"/><line x1="45" y1="40" x2="35" y2="60" stroke="currentColor" stroke-width="1.5"/></svg>'),
         
        ('Asphalt Visions Lightroom Presets', 'Our signature pack of 12 Lightroom Presets optimized for automotive shots. Features high-contrast dark tones, rich golden highlights, and clean metallic grading.', 49.00, 'Presets',
         '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" class="prod-svg"><circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="1.5"/><line x1="30" y1="30" x2="38" y2="38" stroke="currentColor" stroke-width="1.5"/><line x1="70" y1="30" x2="62" y2="38" stroke="currentColor" stroke-width="1.5"/><line x1="30" y1="70" x2="38" y2="62" stroke="currentColor" stroke-width="1.5"/><line x1="70" y1="70" x2="62" y2="62" stroke="currentColor" stroke-width="1.5"/></svg>'),
         
        ('Velocity Reels Lut Pack', 'Premium cinematic color grading LUTs (.cube format) tailored for supercar and motorcycle reels. Optimizes dynamic range, deepens blacks, and saturates warm accents.', 59.00, 'Presets',
         '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" class="prod-svg"><polygon points="30,20 80,20 70,80 20,80" fill="none" stroke="currentColor" stroke-width="2"/><line x1="45" y1="20" x2="35" y2="80" stroke="currentColor" stroke-width="1.5"/><line x1="65" y1="20" x2="55" y2="80" stroke="currentColor" stroke-width="1.5"/></svg>')
    ]
    for name, desc, price, cat, img in products_data:
        prod = Product(name=name, description=desc, price=price, category=cat, image_url=img)
        db.session.add(prod)
        
    # 6. Add Behind the Lens Stories (Rebranded from Blog Posts)
    post1 = Post(
        title='Chasing Light: 48 Hours with the Ferrari SF90 Stradale',
        content='There is something magical about shooting a 1000-horsepower hybrid hypercar in the sweeping mountain canyons at dawn. In this story, we share our setup for chasing the morning sun, rigging the Tilta car mount on our camera vehicle, and managing reflections on the Ferrari\'s deep Nero Daytona paint. We details our use of circular polarizers and how we graded the rich gold highlights to match the dawn rays.',
        author_id=admin.id
    )
    post2 = Post(
        title='Trackside Speed: Capturing the Ducati Panigale V4S at 200km/h',
        content='Capturing a superbike leaning hard at BIC Circuit requires more than just a fast shutter speed. It requires anticipation, panning mastery, and the right rigging. In this behind-the-scenes journal, we discuss our camera tracking car setup, shooting with the Sony FX3 at 120fps, and blending motion blur with sharp details on the gold wheel rims. We also talk about the lighting challenges under the direct midday sun.',
        author_id=admin.id
    )
    
    db.session.add(post1)
    db.session.add(post2)
    db.session.commit()
    
    # 7. Add Comments
    comment1 = Comment(post_id=post1.id, author_name='Rajesh Kumar', content='Absolutely stunning work! The canyon lighting was perfect. Can you share which lens was used for the rolling shots?')
    comment2 = Comment(post_id=post1.id, author_name='Arjun Mehta', content='I bought the Asphalt Visions preset pack and it worked wonders on my BMW M3 shots!')
    comment3 = Comment(post_id=post2.id, author_name='Siddharth S.', content='BIC trackday rolling shots are legendary. Capturing superbikes at speed is incredibly tough.')
    
    db.session.add(comment1)
    db.session.add(comment2)
    db.session.add(comment3)
    db.session.commit()
    
    print("Database seeded successfully!")

if __name__ == '__main__':
    with app.app_context():
        seed_database()
