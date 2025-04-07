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
# Talisman is temporarily disabled for testing purposes.  Re-enable as needed.

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

# Route for serving root-level styles.css
@app.route('/styles.css')
def root_styles():
    logger.info("Serving root-level styles.css")
    try:
        # Try to serve from static folder first
        return app.send_static_file('css/styles.css')
    except Exception as e:
        logger.warning(f"Failed to serve styles.css from static folder: {str(e)}")
        # Fallback to the root styles.css
        try:
            with open('styles.css', 'r') as f:
                css_content = f.read()
                return css_content, 200, {'Content-Type': 'text/css'}
        except Exception as e:
            logger.error(f"Failed to serve styles.css from root: {str(e)}")
            return "/* CSS file not found */", 404, {'Content-Type': 'text/css'}

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
        # Get port from environment or use default 5001
        port = int(os.environ.get('FLASK_PORT', 5001))
        logger.info(f"Flask server starting on port {port}")
        # Using 0.0.0.0 to ensure accessibility within Replit environment
        app.run(host='0.0.0.0', port=port, debug=True, use_reloader=False)
        logger.info("Flask application started successfully")
    except Exception as e:
        logger.error(f"Failed to start Flask application: {str(e)}")