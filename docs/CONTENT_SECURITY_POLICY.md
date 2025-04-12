# Content Security Policy (CSP) Configuration Guide

This document outlines how Content Security Policy is configured in the Dale Loves Whales application to balance security with functionality.

## Overview

The application uses Content Security Policy (CSP) in two places:

1. **Express/Node.js Server**: Uses Helmet middleware to add CSP headers
2. **Flask Server**: Uses Flask-Talisman to implement CSP

Both must be properly configured to allow external resources like Google Maps and YouTube videos.

## Express/Node.js CSP Configuration (Helmet)

The CSP for the Express server is configured in `server/index.ts` using the Helmet middleware:

```typescript
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://*.googleapis.com", "https://*.gstatic.com", "https://*.google.com", "https://*.youtube.com", "https://*.ytimg.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://*.gstatic.com"],
        imgSrc: ["'self'", "data:", "blob:", "https://*.googleapis.com", "https://*.gstatic.com", "https://*.google.com", "https://*.ytimg.com", "https://onlyinhawaii.org", "https://yt3.ggpht.com", "*"],
        connectSrc: ["'self'", "ws:", "wss:", "https://*.googleapis.com", "https://*.google.com", "https://*.youtube.com"],
        fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'", "https://*.youtube.com", "https://*"],
        frameSrc: ["'self'", "https://*.youtube.com", "https://youtube.com", "https://*.youtube-nocookie.com", "https://www.google.com", "https://maps.google.com", "https://www.google.com/maps/", "https://maps.googleapis.com"],
      },
    },
  })
);
```

## Flask CSP Configuration (Talisman)

The CSP for the Flask server is configured in `app.py` using Flask-Talisman:

```python
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
```

## Feature Policy Configuration

Feature Policy is set to allow geolocation access for Google Maps functionality:

```python
feature_policy={
    'geolocation': '*',   # Allow geolocation for Google Maps
    'microphone': '\'none\'',
    'camera': '\'none\''
}
```

## Troubleshooting CSP Issues

If external content (like YouTube videos or Google Maps) is not displaying:

1. Check browser console for CSP violation errors
2. Ensure both the Express and Flask CSP configurations allow the required domains
3. Remember that many services require multiple domains to be whitelisted:
   - Google Maps requires: maps.googleapis.com, maps.google.com, www.google.com
   - YouTube requires: youtube.com, *.youtube.com, ytimg.com, *.ytimg.com

## Important Gotcha

Because this application has two servers (Express and Flask), **both** CSP configurations must be updated when adding new external resources. Missing either one will result in blocking issues.

## Security Considerations

While we need to allow external resources, we've tried to:

1. Limit permissions to only what's necessary
2. Use subdomain wildcards (*.example.com) rather than generic wildcards when possible
3. Disable potentially risky features (camera, microphone) that aren't needed

## CSP Validation

You can validate your CSP implementation using:
- [CSP Evaluator](https://csp-evaluator.withgoogle.com/)
- Browser Developer Tools