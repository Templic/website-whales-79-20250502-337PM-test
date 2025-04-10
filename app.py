from flask import Flask, render_template, request, flash, redirect, url_for
from flask_wtf import CSRFProtect
from flask_talisman import Talisman
from dotenv import load_dotenv
import os
import logging
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
    'frame-src': ['\'self\'', 'https://*.youtube.com', 'https://youtube.com', 'https://*.youtube-nocookie.com', 'https://www.google.com', 'https:'],
    'media-src': ['\'self\'', 'https://*', 'http://*', 'blob:', 'https://*.youtube.com'],
    'script-src': ['\'self\'', '\'unsafe-inline\'', '\'unsafe-eval\'', 'https://*.youtube.com', 'https://*.ytimg.com', 'https://youtube.com', 'https:'],
    'connect-src': ['\'self\'', 'https://*.youtube.com', 'https://youtube.com', 'https:', 'http:', 'ws:', 'wss:']
}

# Initialize Talisman with our CSP configuration
talisman = Talisman(
    app,
    content_security_policy=csp,
    content_security_policy_nonce_in=['script-src'],
    feature_policy={
        'geolocation': '\'none\'',
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