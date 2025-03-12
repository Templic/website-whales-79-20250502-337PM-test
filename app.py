from flask import Flask, render_template, request, flash, redirect, url_for
from flask_wtf import CSRFProtect
from flask_talisman import Talisman
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

app = Flask(__name__, 
    static_folder='static',
    template_folder='templates'
)

# Security configurations
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', os.urandom(24))
csrf = CSRFProtect(app)
Talisman(app, 
    content_security_policy={
        'default-src': "'self'",
        'img-src': "'self' data: https:",
        'style-src': "'self' 'unsafe-inline' https://fonts.googleapis.com",
        'font-src': "'self' https://fonts.gstatic.com",
    }
)

@app.route('/')
def home():
    return render_template('home_page.html')

@app.route('/about')
def about():
    return render_template('about_page.html')

@app.route('/music-release')
def music_release():
    return render_template('music_release_page.html')

@app.route('/music')
def music():
    return render_template('music_page.html')

@app.route('/tour')
def tour():
    return render_template('tour_page.html')

@app.route('/engage')
def engage():
    return render_template('engage_page.html')

@app.route('/newsletter', methods=['GET', 'POST'])
def newsletter():
    if request.method == 'POST':
        email = request.form.get('email')
        # Add email validation and subscription logic here
        flash('Thank you for subscribing!', 'success')
        return redirect(url_for('newsletter'))
    return render_template('newsletter_page.html')

@app.route('/blog')
def blog():
    return render_template('blog_page.html')

@app.route('/collaboration')
def collaboration():
    return render_template('gifts_and_sponsorships_page.html')

@app.route('/contact', methods=['GET', 'POST'])
def contact():
    if request.method == 'POST':
        # Add contact form handling logic here
        flash('Message sent successfully!', 'success')
        return redirect(url_for('contact'))
    return render_template('contact_page.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
