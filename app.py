from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from config import Config
from models import db, User, Skill, ContactMessage, Task, Product, Order, OrderItem, Post, Comment
from functools import wraps
import os

app = Flask(__name__)
app.config.from_object(Config)

# Initialize database
db.init_app(app)

# Authentication Decorators
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Unauthorized access. Please log in.'}), 401
        return f(*args, **kwargs)
    return decorated_function

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if session.get('role') != 'admin':
            return jsonify({'error': 'Forbidden. Admin credentials required.'}), 403
        return f(*args, **kwargs)
    return decorated_function


# ==========================================
# PAGE ROUTING
# ==========================================
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/tasks')
def tasks_page():
    return render_template('tasks.html')

@app.route('/shop')
def shop_page():
    return render_template('shop.html')

@app.route('/blog')
def blog_page():
    return render_template('blog.html')

@app.route('/admin')
def admin_page():
    return render_template('admin.html')

@app.route('/sw.js')
def serve_sw():
    response = app.send_static_file('sw.js')
    response.headers['Content-Type'] = 'application/javascript'
    response.headers['Service-Worker-Allowed'] = '/'
    return response

@app.route('/manifest.json')
def serve_manifest():
    response = app.send_static_file('manifest.json')
    response.headers['Content-Type'] = 'application/json'
    return response


# ==========================================
# AUTHENTICATION API
# ==========================================
@app.route('/api/auth/register', methods=['POST'])
def api_register():
    data = request.get_json() or {}
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()
    
    if not username or not password:
        return jsonify({'error': 'Username and password are required'}), 400
        
    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'Username already exists'}), 400
        
    user = User(username=username, role='user')
    user.set_password(password)
    db.session.add(user)
    db.session.commit()
    
    # Auto-login after registration
    session['user_id'] = user.id
    session['username'] = user.username
    session['role'] = user.role
    
    return jsonify({'message': 'Registration successful', 'user': user.to_dict()}), 201

@app.route('/api/auth/login', methods=['POST'])
def api_login():
    data = request.get_json() or {}
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()
    
    # Check if admin matches configuration values first
    if username == app.config['ADMIN_USERNAME'] and password == app.config['ADMIN_PASSWORD']:
        # Ensure admin user exists in DB for foreign key relations
        admin_user = User.query.filter_by(username=username).first()
        if not admin_user:
            admin_user = User(username=username, role='admin')
            admin_user.set_password(password)
            db.session.add(admin_user)
            db.session.commit()
            
        session['user_id'] = admin_user.id
        session['username'] = admin_user.username
        session['role'] = 'admin'
        return jsonify({'message': 'Logged in as Admin successfully', 'user': admin_user.to_dict()})
        
    user = User.query.filter_by(username=username).first()
    if not user or not user.check_password(password):
        return jsonify({'error': 'Invalid username or password'}), 401
        
    session['user_id'] = user.id
    session['username'] = user.username
    session['role'] = user.role
    
    return jsonify({'message': 'Login successful', 'user': user.to_dict()})

@app.route('/api/auth/logout', methods=['POST'])
def api_logout():
    session.clear()
    return jsonify({'message': 'Logged out successfully'})

@app.route('/api/auth/google', methods=['POST'])
def api_google_login():
    data = request.get_json() or {}
    credential = data.get('credential', '').strip()
    email = data.get('email', '').strip()
    name = data.get('name', '').strip()
    
    if credential:
        import urllib.request
        import json
        try:
            # Call Google's tokeninfo API to verify the credential ID token
            url = f"https://oauth2.googleapis.com/tokeninfo?id_token={credential}"
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=5) as response:
                token_info = json.loads(response.read().decode('utf-8'))
                if 'error_description' in token_info:
                    return jsonify({'error': f"Google verification failed: {token_info['error_description']}"}), 400
                email = token_info.get('email', '').strip()
                name = token_info.get('name', email.split('@')[0]).strip()
        except Exception as e:
            return jsonify({'error': f"Google token verification failed: {str(e)}"}), 400
            
    if not email:
        return jsonify({'error': 'Email is required'}), 400
        
    username = email.split('@')[0]
    
    user = User.query.filter_by(username=username).first()
    if not user:
        import secrets
        user = User(username=username, role='user')
        user.set_password(secrets.token_hex(16))
        db.session.add(user)
        db.session.commit()
        
    session['user_id'] = user.id
    session['username'] = user.username
    session['role'] = user.role
    
    return jsonify({'message': 'Logged in with Google successfully', 'user': user.to_dict()})

@app.route('/api/auth/status', methods=['GET'])
def api_auth_status():
    google_client_id = app.config.get('GOOGLE_CLIENT_ID', '')
    if 'user_id' in session:
        return jsonify({
            'authenticated': True,
            'user': {
                'id': session['user_id'],
                'username': session['username'],
                'role': session['role']
            },
            'google_client_id': google_client_id
        })
    return jsonify({
        'authenticated': False,
        'google_client_id': google_client_id
    })


# ==========================================
# PORTFOLIO API (Skills, Messages, Projects)
# ==========================================
@app.route('/api/skills', methods=['GET'])
def get_skills():
    skills = Skill.query.all()
    return jsonify([skill.to_dict() for skill in skills])

@app.route('/api/projects', methods=['GET'])
def get_projects():
    # We return a descriptive metadata JSON representing the luxury vehicle projects 
    # being showcased within this photography portfolio.
    projects_list = [
        {
            'id': 1,
            'title': 'Lamborghini Huracán STO Sunset Session',
            'description': 'A sunset rolling session capture and night city automotive cinematic focusing on the STO\'s aggressive lines, carbon-fiber aerodynamics, and raw V10 engine presence.',
            'category': 'Supercars',
            'technologies': 'Sony FX3, Tilta Hydra Car Mount, Profoto Studio Lighting, 4K Cinema Capture',
            'github_url': 'https://instagram.com',
            'live_url': '/static/images/lambo_hero.png',
            'image_url': 'lambo_hero'
        },
        {
            'id': 2,
            'title': 'Ducati Panigale V4S Trackside Attack',
            'description': 'High-speed trackside tracking and tight cornering action shots at BIC Circuit, capturing the red-and-gold superbike in its natural racing posture.',
            'category': 'Superbikes',
            'technologies': 'Sony FX3, DJI Ronin 2 Stabilizer, Sony G-Master 70-200mm, High-speed tracking vehicle',
            'github_url': 'https://instagram.com',
            'live_url': '/static/images/ducati_portfolio.png',
            'image_url': 'ducati_portfolio'
        },
        {
            'id': 3,
            'title': 'Porsche 911 GT3 RS Warehouse Studio',
            'description': 'A dramatic industrial studio session highlighting the GT3 RS\'s extreme aerodynamics, custom gold wheels, and raw wing profile under warm spotlights.',
            'category': 'Supercars',
            'technologies': 'RED Komodo, Profoto Pro-11 Studio Pack, Zeiss Supreme Primes, Matte Studio Box',
            'github_url': 'https://instagram.com',
            'live_url': '/static/images/porsche_portfolio.png',
            'image_url': 'porsche_portfolio'
        },
        {
            'id': 4,
            'title': 'Mercedes-AMG GT 63 S Midnight Run',
            'description': 'Sleek, blacked-out rolling shot on wet highway pavement under yellow urban streetlights, blending motion blur with crisp reflections.',
            'category': 'Luxury Cars',
            'technologies': 'Leica M11, Summilux 35mm Prime, High-speed tracking chase car',
            'github_url': 'https://instagram.com',
            'live_url': '/static/images/amg_portfolio.png',
            'image_url': 'amg_portfolio'
        },
        {
            'id': 5,
            'title': 'Ferrari SF90 Stradale Canyon Run',
            'description': 'Sweeping canyon road tracking shots capturing the hybrid Ferrari hypercar in dynamic action during a golden dawn hour.',
            'category': 'Supercars',
            'technologies': 'RED Komodo, DJI Inspire 3 Drone, circular polarizers, DaVinci Resolve color grading',
            'github_url': 'https://instagram.com',
            'live_url': '/static/images/canyon_run.png',
            'image_url': 'canyon_run'
        },
        {
            'id': 6,
            'title': 'High-Octane Cinematic Reels',
            'description': 'A high-octane compile reel combining Lamborghini launches, Ferrari engine notes, and superbikes cornering at night. Styled in high contrast gold-and-black.',
            'category': 'Cinematic Reels',
            'technologies': 'RED Komodo, Sony FX3, DJI Inspire 3, Tilta Arm, DaVinci Resolve Studio',
            'github_url': 'https://youtube.com',
            'live_url': '/static/images/lambo_hero.png',
            'image_url': 'lambo_hero'
        }
    ]
    return jsonify(projects_list)

def send_booking_email(name, client_email, subject, message_body):
    import smtplib
    from email.mime.text import MIMEText
    from email.mime.multipart import MIMEMultipart
    
    # Read SMTP configuration from environment
    smtp_server = os.environ.get('SMTP_SERVER', 'smtp.gmail.com')
    try:
        smtp_port = int(os.environ.get('SMTP_PORT', 587))
    except ValueError:
        smtp_port = 587
    smtp_user = os.environ.get('SMTP_USERNAME', '')
    smtp_pass = os.environ.get('SMTP_PASSWORD', '')
    
    receiver_email = 'tilaksontana59@gmail.com'
    
    msg = MIMEMultipart()
    msg['From'] = smtp_user if smtp_user else 'bookings@carboncinema.com'
    msg['To'] = receiver_email
    msg['Subject'] = f"[Carbon Cinema Booking] {subject}"
    
    body = f"""New Cinematic Shoot Booking Received!
------------------------------------
Client Name: {name}
Client Email: {client_email}

Details:
{message_body}
"""
    msg.attach(MIMEText(body, 'plain'))
    
    if not smtp_user or not smtp_pass:
        print("\n=== [MOCK EMAIL SENT TO tilaksontana59@gmail.com] ===")
        print(f"Subject: {msg['Subject']}")
        print(body)
        print("=====================================================\n")
        return False
        
    try:
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(smtp_user, smtp_pass)
        server.sendmail(msg['From'], receiver_email, msg.as_string())
        server.quit()
        print(f"Real SMTP Email sent successfully to {receiver_email}!")
        return True
    except Exception as e:
        print(f"SMTP Email send failed: {str(e)}")
        print("\n=== [FALLBACK: EMAIL DETAILS FOR tilaksontana59@gmail.com] ===")
        print(f"Subject: {msg['Subject']}")
        print(body)
        print("============================================================\n")
        return False

@app.route('/api/contact', methods=['POST'])
def submit_contact():
    data = request.get_json() or {}
    name = data.get('name', '').strip()
    email = data.get('email', '').strip()
    subject = data.get('subject', '').strip()
    message = data.get('message', '').strip()
    
    if not all([name, email, subject, message]):
        return jsonify({'error': 'All contact fields are required'}), 400
        
    msg = ContactMessage(name=name, email=email, subject=subject, message=message)
    db.session.add(msg)
    db.session.commit()
    
    # Send email notification
    send_booking_email(name, email, subject, message)
    
    return jsonify({'message': 'Thank you! Your message has been received.', 'message_id': msg.id}), 201


# ==========================================
# TASK MANAGER API
# ==========================================
@app.route('/api/tasks', methods=['GET'])
@login_required
def get_tasks():
    tasks = Task.query.filter_by(user_id=session['user_id']).order_by(Task.created_at.desc()).all()
    return jsonify([task.to_dict() for task in tasks])

@app.route('/api/tasks', methods=['POST'])
@login_required
def create_task():
    data = request.get_json() or {}
    title = data.get('title', '').strip()
    description = data.get('description', '').strip()
    due_date = data.get('due_date', '').strip()
    
    if not title:
        return jsonify({'error': 'Task title is required'}), 400
        
    task = Task(
        user_id=session['user_id'],
        title=title,
        description=description,
        status='Pending',
        due_date=due_date if due_date else None
    )
    db.session.add(task)
    db.session.commit()
    
    return jsonify({'message': 'Task created', 'task': task.to_dict()}), 201

@app.route('/api/tasks/<int:task_id>', methods=['PUT'])
@login_required
def update_task(task_id):
    task = Task.query.filter_by(id=task_id, user_id=session['user_id']).first()
    if not task:
        return jsonify({'error': 'Task not found'}), 404
        
    data = request.get_json() or {}
    task.title = data.get('title', task.title).strip()
    task.description = data.get('description', task.description).strip()
    task.status = data.get('status', task.status).strip()
    if 'due_date' in data:
        task.due_date = data.get('due_date', '').strip() or None
        
    db.session.commit()
    return jsonify({'message': 'Task updated', 'task': task.to_dict()})

@app.route('/api/tasks/<int:task_id>', methods=['DELETE'])
@login_required
def delete_task(task_id):
    task = Task.query.filter_by(id=task_id, user_id=session['user_id']).first()
    if not task:
        return jsonify({'error': 'Task not found'}), 404
        
    db.session.delete(task)
    db.session.commit()
    return jsonify({'message': 'Task deleted successfully'})


# ==========================================
# E-COMMERCE API
# ==========================================
@app.route('/api/shop/products', methods=['GET'])
def get_products():
    products = Product.query.all()
    return jsonify([p.to_dict() for p in products])

@app.route('/api/shop/orders', methods=['POST'])
@login_required
def place_order():
    data = request.get_json() or {}
    items_list = data.get('items', [])
    
    if not items_list:
        return jsonify({'error': 'Shopping cart is empty'}), 400
        
    total_price = 0
    order_items = []
    
    for item in items_list:
        prod_id = item.get('product_id')
        qty = item.get('quantity', 1)
        
        product = Product.query.get(prod_id)
        if not product:
            return jsonify({'error': f'Product with ID {prod_id} not found'}), 404
            
        price = product.price
        total_price += price * qty
        
        order_item = OrderItem(product_id=prod_id, quantity=qty, price=price)
        order_items.append(order_item)
        
    order = Order(user_id=session['user_id'], total_price=total_price, status='Pending')
    db.session.add(order)
    db.session.commit()  # commit to generate order.id
    
    for item in order_items:
        item.order_id = order.id
        db.session.add(item)
        
    db.session.commit()
    return jsonify({'message': 'Order placed successfully', 'order': order.to_dict()}), 201

@app.route('/api/shop/orders', methods=['GET'])
@login_required
def get_orders():
    orders = Order.query.filter_by(user_id=session['user_id']).order_by(Order.created_at.desc()).all()
    return jsonify([order.to_dict() for order in orders])


# ==========================================
# BLOG PLATFORM API
# ==========================================
@app.route('/api/blog/posts', methods=['GET'])
def get_blog_posts():
    posts = Post.query.order_by(Post.created_at.desc()).all()
    return jsonify([post.to_dict() for post in posts])

@app.route('/api/blog/posts/<int:post_id>', methods=['GET'])
def get_blog_post_details(post_id):
    post = Post.query.get(post_id)
    if not post:
        return jsonify({'error': 'Blog post not found'}), 404
        
    comments = Comment.query.filter_by(post_id=post_id).order_by(Comment.created_at.asc()).all()
    
    details = post.to_dict()
    details['comments'] = [comment.to_dict() for comment in comments]
    return jsonify(details)

@app.route('/api/blog/posts/<int:post_id>/comments', methods=['POST'])
def create_comment(post_id):
    post = Post.query.get(post_id)
    if not post:
        return jsonify({'error': 'Blog post not found'}), 404
        
    data = request.get_json() or {}
    author_name = data.get('author_name', '').strip()
    content = data.get('content', '').strip()
    
    # If a user is logged in, default to their username
    if 'username' in session and not author_name:
        author_name = session['username']
        
    if not author_name:
        author_name = 'Anonymous Visitor'
        
    if not content:
        return jsonify({'error': 'Comment content is required'}), 400
        
    comment = Comment(post_id=post_id, author_name=author_name, content=content)
    db.session.add(comment)
    db.session.commit()
    
    return jsonify({'message': 'Comment posted successfully', 'comment': comment.to_dict()}), 201

@app.route('/api/blog/posts', methods=['POST'])
@login_required
def create_blog_post():
    data = request.get_json() or {}
    title = data.get('title', '').strip()
    content = data.get('content', '').strip()
    
    if not title or not content:
        return jsonify({'error': 'Title and content are required'}), 400
        
    post = Post(title=title, content=content, author_id=session['user_id'])
    db.session.add(post)
    db.session.commit()
    
    return jsonify({'message': 'Blog post created successfully', 'post': post.to_dict()}), 201

@app.route('/api/blog/posts/<int:post_id>', methods=['PUT'])
@login_required
def update_blog_post(post_id):
    post = Post.query.get(post_id)
    if not post:
        return jsonify({'error': 'Post not found'}), 404
        
    # Only author or admin can update
    if post.author_id != session['user_id'] and session.get('role') != 'admin':
        return jsonify({'error': 'Unauthorized to edit this post'}), 403
        
    data = request.get_json() or {}
    post.title = data.get('title', post.title).strip()
    post.content = data.get('content', post.content).strip()
    
    db.session.commit()
    return jsonify({'message': 'Post updated successfully', 'post': post.to_dict()})

@app.route('/api/blog/posts/<int:post_id>', methods=['DELETE'])
@login_required
def delete_blog_post(post_id):
    post = Post.query.get(post_id)
    if not post:
        return jsonify({'error': 'Post not found'}), 404
        
    # Only author or admin can delete
    if post.author_id != session['user_id'] and session.get('role') != 'admin':
        return jsonify({'error': 'Unauthorized to delete this post'}), 403
        
    db.session.delete(post)
    db.session.commit()
    return jsonify({'message': 'Post deleted successfully'})


# ==========================================
# ADMIN DASHBOARD CRUD & STATS
# ==========================================
@app.route('/api/messages', methods=['GET'])
@admin_required
def get_messages():
    messages = ContactMessage.query.order_by(ContactMessage.created_at.desc()).all()
    return jsonify([msg.to_dict() for msg in messages])

@app.route('/api/messages/<int:msg_id>', methods=['PUT'])
@admin_required
def toggle_message_status(msg_id):
    msg = ContactMessage.query.get(msg_id)
    if not msg:
        return jsonify({'error': 'Message not found'}), 404
        
    msg.is_read = not msg.is_read
    db.session.commit()
    return jsonify({'message': 'Message updated', 'is_read': msg.is_read})

@app.route('/api/messages/<int:msg_id>', methods=['DELETE'])
@admin_required
def delete_message(msg_id):
    msg = ContactMessage.query.get(msg_id)
    if not msg:
        return jsonify({'error': 'Message not found'}), 404
        
    db.session.delete(msg)
    db.session.commit()
    return jsonify({'message': 'Message deleted successfully'})

@app.route('/api/shop/products', methods=['POST'])
@admin_required
def admin_add_product():
    data = request.get_json() or {}
    name = data.get('name', '').strip()
    description = data.get('description', '').strip()
    price = data.get('price')
    category = data.get('category', '').strip()
    image_url = data.get('image_url', '').strip()
    
    if not all([name, description, price, category]):
        return jsonify({'error': 'Missing product parameters'}), 400
        
    try:
        price_val = float(price)
    except ValueError:
        return jsonify({'error': 'Price must be a number'}), 400
        
    # Default product icon SVG if none is specified
    if not image_url:
        image_url = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" class="prod-svg"><rect x="20" y="20" width="60" height="60" rx="4" fill="none" stroke="currentColor" stroke-width="2"/><line x1="20" y1="50" x2="80" y2="50" stroke="currentColor" stroke-width="2"/><circle cx="50" cy="50" r="10" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>'
        
    prod = Product(name=name, description=description, price=price_val, category=category, image_url=image_url)
    db.session.add(prod)
    db.session.commit()
    
    return jsonify({'message': 'Product added', 'product': prod.to_dict()}), 201

@app.route('/api/shop/products/<int:prod_id>', methods=['PUT'])
@admin_required
def admin_update_product(prod_id):
    prod = Product.query.get(prod_id)
    if not prod:
        return jsonify({'error': 'Product not found'}), 404
        
    data = request.get_json() or {}
    prod.name = data.get('name', prod.name).strip()
    prod.description = data.get('description', prod.description).strip()
    prod.category = data.get('category', prod.category).strip()
    if 'price' in data:
        try:
            prod.price = float(data.get('price'))
        except ValueError:
            return jsonify({'error': 'Price must be a number'}), 400
    if 'image_url' in data:
        prod.image_url = data.get('image_url').strip()
        
    db.session.commit()
    return jsonify({'message': 'Product updated', 'product': prod.to_dict()})

@app.route('/api/shop/products/<int:prod_id>', methods=['DELETE'])
@admin_required
def admin_delete_product(prod_id):
    prod = Product.query.get(prod_id)
    if not prod:
        return jsonify({'error': 'Product not found'}), 404
        
    db.session.delete(prod)
    db.session.commit()
    return jsonify({'message': 'Product deleted successfully'})

@app.route('/api/admin/stats', methods=['GET'])
@admin_required
def admin_get_stats():
    user_count = User.query.count()
    task_count = Task.query.count()
    product_count = Product.query.count()
    order_count = Order.query.count()
    msg_count = ContactMessage.query.count()
    unread_msg = ContactMessage.query.filter_by(is_read=False).count()
    post_count = Post.query.count()
    comment_count = Comment.query.count()
    
    return jsonify({
        'users': user_count,
        'tasks': task_count,
        'products': product_count,
        'orders': order_count,
        'messages': msg_count,
        'unread_messages': unread_msg,
        'posts': post_count,
        'comments': comment_count
    })


if __name__ == '__main__':
    # Initialize DB tables if database does not exist
    with app.app_context():
        db.create_all()
    # Serve locally
    app.run(host='0.0.0.0', port=5000, debug=True)
