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
    
    # 3. Add Skills
    skills_data = [
        # Frontend
        ('HTML5', 'Frontend', 95),
        ('CSS3 (Flexbox/Grid)', 'Frontend', 90),
        ('JavaScript (ES6+)', 'Frontend', 88),
        ('React.js', 'Frontend', 85),
        # Backend
        ('Python / Flask', 'Backend', 90),
        ('Node.js / Express', 'Backend', 80),
        ('Django', 'Backend', 75),
        # Database
        ('SQLite', 'Database', 85),
        ('PostgreSQL', 'Database', 80),
        ('MongoDB', 'Database', 78),
        # Tools
        ('Git & GitHub', 'Tools', 88),
        ('Docker', 'Tools', 70),
        ('Vercel / Netlify / Render', 'Tools', 85)
    ]
    for name, cat, prof in skills_data:
        skill = Skill(name=name, category=cat, proficiency=prof)
        db.session.add(skill)
        
    # 4. Add Tasks for testuser
    tasks_data = [
        ('Complete portfolio development', 'Integrate Flask, SQLite, and the frontend modules.', 'Completed'),
        ('Deploy portfolio to Render/GitHub', 'Publish source files and hook up automatic deployment.', 'Pending'),
        ('Write a blog post about CSS variables', 'Write a comprehensive guide explaining CSS utility classes and variables.', 'Pending'),
        ('Test checkout cart operations', 'Make sure tax calculations and line items tally up during checkout.', 'Completed')
    ]
    for title, desc, status in tasks_data:
        task = Task(user_id=test_user.id, title=title, description=desc, status=status)
        db.session.add(task)
        
    # 5. Add Products for E-Commerce
    # We will use simple SVGs or nice visual representations for products
    products_data = [
        ('Quantum Keycap Mechanical Keyboard', 'Anodized aluminum frame, hot-swappable tactile linear switches, and customized PBT double-shot keycaps.', 189.99, 'Keyboard', 
         '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" class="prod-svg"><rect x="10" y="30" width="80" height="40" rx="5" fill="none" stroke="currentColor" stroke-width="2"/><line x1="20" y1="40" x2="80" y2="40" stroke="currentColor" stroke-width="1.5" stroke-dasharray="2 3"/><line x1="20" y1="50" x2="80" y2="50" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3 3"/><line x1="30" y1="60" x2="70" y2="60" stroke="currentColor" stroke-width="3"/></svg>'),
        
        ('Spectre Wireless Optical Mouse', 'Ergonomic vertical design, dual-channel 2.4Ghz wireless mode, and a high-precision 26k DPI optical sensor.', 89.50, 'Mouse',
         '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" class="prod-svg"><path d="M50 20 C35 20 30 35 30 55 C30 75 38 80 50 80 C62 80 70 75 70 55 C70 35 65 20 50 20 Z" fill="none" stroke="currentColor" stroke-width="2"/><line x1="50" y1="20" x2="50" y2="45" stroke="currentColor" stroke-width="2"/><line x1="30" y1="45" x2="70" y2="45" stroke="currentColor" stroke-width="1.5"/></svg>'),
         
        ('AeroDesk Dual Monitor Arm', 'Heavy-duty gas spring desktop mount supporting dual 32-inch displays. Integrated cable routing channels.', 125.00, 'Desk Setup',
         '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" class="prod-svg"><path d="M20 30 L45 30 L45 70 L55 70 L55 30 L80 30" fill="none" stroke="currentColor" stroke-width="2"/><rect x="10" y="20" width="25" height="15" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/><rect x="65" y="20" width="25" height="15" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>'),
         
        ('Eclipse USB-C Docking Station', '14-in-1 premium hub with triple 4K display support, 100W Power Delivery, and multi-gigabit Ethernet port.', 159.00, 'Hubs',
         '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" class="prod-svg"><rect x="15" y="35" width="70" height="30" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="30" cy="50" r="3" fill="currentColor"/><circle cx="45" cy="50" r="3" fill="currentColor"/><circle cx="60" cy="50" r="3" fill="currentColor"/><rect x="70" y="47" width="8" height="6" fill="none" stroke="currentColor" stroke-width="1"/></svg>')
    ]
    for name, desc, price, cat, img in products_data:
        prod = Product(name=name, description=desc, price=price, category=cat, image_url=img)
        db.session.add(prod)
        
    # 6. Add Blog Posts and Comments
    post1 = Post(
        title='Getting Started with Full-Stack Development',
        content='Full-stack development involves working with both the front-end (client-side) and back-end (server-side) portions of an application. In this post, we discuss the essential components: routing, middleware, database integrity, and UI state management. Building a unified environment (like this portfolio) is one of the best ways to understand how the components connect together.',
        author_id=admin.id
    )
    post2 = Post(
        title='Why Flask is Perfect for Small to Medium Applications',
        content='Flask is a micro-framework written in Python. Unlike monolithic frameworks like Django, Flask does not force any specific directory layout or database adapter. This provides developers with the freedom to choose their preferred libraries. In this portfolio, we pair Flask with SQLite and SQLAlchemy to deliver a fast, dependency-free development experience that runs out-of-the-box.',
        author_id=admin.id
    )
    
    db.session.add(post1)
    db.session.add(post2)
    db.session.commit()
    
    # 7. Add Comments
    comment1 = Comment(post_id=post1.id, author_name='Jane Miller', content='Excellent summary! This is exactly what I needed to clear up my understanding of client-server interaction.')
    comment2 = Comment(post_id=post1.id, author_name='Alex Rivera', content='What are your thoughts on using Fetch API vs Axios for front-end requests?')
    comment3 = Comment(post_id=post2.id, author_name='DevGuy99', content='Agreed. Flask is incredibly lightweight. SQLite makes local testing completely painless too!')
    
    db.session.add(comment1)
    db.session.add(comment2)
    db.session.add(comment3)
    db.session.commit()
    
    print("Database seeded successfully!")

if __name__ == '__main__':
    with app.app_context():
        seed_database()
