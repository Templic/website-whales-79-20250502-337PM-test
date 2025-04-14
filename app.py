from flask import Flask, render_template, request, flash, redirect, url_for, jsonify
from flask_wtf import CSRFProtect
from flask_talisman import Talisman
from dotenv import load_dotenv
import os
import logging
import json
from forms import ContactForm, NewsletterForm

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__, 
    static_folder='static',
    template_folder='templates'
)

# Security configurations
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', os.urandom(24))
csrf = CSRFProtect(app)

# Configure CSP to allow external resources
csp = {
    'default-src': ['\'self\'', '\'unsafe-inline\'', '\'unsafe-eval\'', 'https:', 'http:', 'data:'],
    'img-src': ['\'self\'', 'data:', '*', 'https://onlyinhawaii.org', 'https://*.googleapis.com', 'https://*.gstatic.com', 'https://*.ytimg.com', 'https://yt3.ggpht.com', 'https:'],
    'style-src': ['\'self\'', '\'unsafe-inline\'', 'https://fonts.googleapis.com', 'https:'],
    'font-src': ['\'self\'', 'https://fonts.gstatic.com', 'https:', 'data:'],
    'frame-src': ['\'self\'', 'https://*.youtube.com', 'https://youtube.com', 'https://*.youtube-nocookie.com', 'https://www.google.com', 'https://maps.google.com', 'https://www.google.com/maps/', 'https://maps.googleapis.com', 'https:'],
    'media-src': ['\'self\'', 'https://*', 'http://*', 'blob:', 'https://*.youtube.com'],
    'script-src': ['\'self\'', '\'unsafe-inline\'', '\'unsafe-eval\'', 'https://*.youtube.com', 'https://*.ytimg.com', 'https://youtube.com', 'https://maps.googleapis.com', 'https://maps.google.com', 'https:'],
    'connect-src': ['\'self\'', 'https://*.youtube.com', 'https://youtube.com', 'https://maps.googleapis.com', 'https://maps.google.com', 'https:', 'http:', 'ws:', 'wss:']
}

# Initialize Talisman with our CSP configuration
talisman = Talisman(
    app,
    content_security_policy=csp,
    content_security_policy_nonce_in=['script-src'],
    feature_policy={
        'geolocation': '*',
        'microphone': '\'none\'',
        'camera': '\'none\''
    }
)

@app.route('/')
def home():
    return render_template('home_page.html')

@app.route('/about')
def about():
    return render_template('about_page.html')

@app.route('/new-music')
def new_music():
    return render_template('music_release_page.html')

@app.route('/archived-music')
def archived_music():
    return render_template('music_page.html')

@app.route('/tour')
def tour():
    return render_template('tour_page.html')

@app.route('/engage')
def engage():
    return render_template('engage_page.html')

@app.route('/newsletter', methods=['GET', 'POST'])
def newsletter():
    form = NewsletterForm()
    if request.method == 'POST' and form.validate():
        email = form.email.data
        # Add email validation and subscription logic here
        logger.info(f"Newsletter subscription request for email: {email}")
        flash('Thank you for subscribing!', 'success')
        return redirect(url_for('newsletter'))
    return render_template('newsletter_page.html', form=form)

@app.route('/blog')
def blog():
    return render_template('blog_page.html')

@app.route('/collaboration')
def collaboration():
    return render_template('gifts_and_sponsorships_page.html')

@app.route('/contact', methods=['GET', 'POST'])
def contact():
    form = ContactForm()
    if request.method == 'POST' and form.validate():
        # Add contact form handling logic here
        logger.info(f"Contact form submission from: {form.email.data}")
        flash('Message sent successfully!', 'success')
        return redirect(url_for('contact'))
    return render_template('contact_page.html', form=form)

@app.route('/accessibility')
def accessibility():
    return render_template('accessibility_page.html')

@app.route('/ai-chat')
def ai_chat():
    return render_template('ai_chat_page.html')

@app.route('/api/ai-agents', methods=['GET'])
def get_ai_agents():
    """API endpoint to get AI agent information"""
    agents = [
        {
            "id": "cosmic-guide",
            "name": "Cosmic Guide",
            "description": "A spiritual guide with deep knowledge of cosmic energies and meditation practices.",
            "avatar": "/static/images/agents/cosmic-guide.svg",
            "status": "available",
            "tags": ["spiritual", "meditation", "guidance"]
        },
        {
            "id": "harmonic-helper",
            "name": "Harmonic Helper",
            "description": "An expert in sound healing, frequencies and harmonics.",
            "avatar": "/static/images/agents/harmonic-helper.svg",
            "status": "available",
            "tags": ["sound", "healing", "frequencies"]
        },
        {
            "id": "wisdom-keeper",
            "name": "Wisdom Keeper",
            "description": "A repository of ancient wisdom and philosophical insights.",
            "avatar": "/static/images/agents/wisdom-keeper.svg",
            "status": "available",
            "tags": ["philosophy", "wisdom", "knowledge"]
        },
        {
            "id": "shop-oracle",
            "name": "Shop Oracle",
            "description": "Your personal guide to product recommendations and purchases.",
            "avatar": "/static/images/agents/shop-oracle.svg",
            "status": "available",
            "tags": ["shopping", "products", "recommendations"]
        }
    ]
    return jsonify(agents)

@app.route('/api/ai-chat', methods=['POST'])
def send_ai_message():
    """API endpoint to send a message to an AI agent and receive a response"""
    data = request.json
    if not data or 'message' not in data or 'agentId' not in data:
        return jsonify({"error": "Invalid message format"}), 400
    
    # In a production environment, you would connect to an actual AI service here
    # For now, we'll return simulated responses
    agent_id = data['agentId']
    user_message = data['message']
    
    logger.info(f"AI chat message to {agent_id}: {user_message}")
    
    # Simulate response based on agent and message content
    if agent_id == "cosmic-guide":
        response = f"The cosmic energies are guiding you toward inner peace. Your question about '{user_message}' relates to the universal flow of consciousness."
    elif agent_id == "harmonic-helper":
        response = f"The frequency patterns in your message about '{user_message}' resonate with the 432 Hz healing frequency. This can harmonize your energy centers."
    elif agent_id == "wisdom-keeper":
        response = f"Ancient wisdom teaches us that questions like '{user_message}' lead us to deeper understanding. The path of self-discovery is eternal."
    elif agent_id == "shop-oracle":
        response = f"Based on your interest in '{user_message}', I recommend our new crystal sound bowls and harmonizing essential oils, available in our shop."
    else:
        response = f"I've received your message about '{user_message}' and I'm processing it thoughtfully."
    
    return jsonify({
        "agentId": agent_id,
        "message": response,
        "timestamp": request.json.get('timestamp', '')
    })

@app.errorhandler(404)
def page_not_found(e):
    return render_template('404.html'), 404

@app.errorhandler(500)
def internal_server_error(e):
    logger.error(f"Internal server error: {str(e)}")
    return render_template('500.html'), 500

# Test route for basic connectivity verification
@app.route('/test')
def test():
    logger.info("Test route accessed")
    return "Flask server is running!", 200

# Context processor to add year to all templates
@app.context_processor
def inject_year():
    from datetime import datetime
    return dict(year=datetime.utcnow().year)

if __name__ == '__main__':
    logger.info("Starting Flask application...")
    try:
        # Change port to 5001 to avoid conflict with Node.js server
        app.run(host='0.0.0.0', port=5001, debug=True, use_reloader=False)
        logger.info("Flask application started successfully")
    except Exception as e:
        logger.error(f"Failed to start Flask application: {str(e)}")