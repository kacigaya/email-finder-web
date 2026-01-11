# Email Finder

**Email Finder** is a web application that helps generate professional email addresses from names and a company domain. The app supports multiple common email formats and offers multilingual support (French, English, Spanish).

**You can test it live here**: [https://email-finder-web.netlify.app](https://email-finder-web.netlify.app)

---

## Features

- **Email Address Generation**: Easily create professional email addresses from names and a domain
- **Multiple Formats**: Generates 8 different email formats for each name:
  - `firstname.lastname@domain.com`
  - `f.lastname@domain.com`
  - `firstname.l@domain.com`
  - `firstnamelastname@domain.com`
  - `flastname@domain.com`
  - `lastname.firstname@domain.com`
  - `l.firstname@domain.com`
  - `initials@domain.com`
- **Multilingual Interface**: Available in **French**, **English**, and **Spanish**
- **Accent Normalization**: Automatically removes accents and special characters
- **Easy Copy**: Copy individual or all generated emails with one click
- **Responsive Design**: Works great on desktop, tablet, and mobile devices  

---

## Installation (optional)

If you'd like to run it locally:

```bash
git clone https://github.com/gayakaci20/email-finder-web.git
cd email-finder-web
# Open index.html in your browser
```

Or visit the live demo here: [https://email-finder-web.netlify.app](https://email-finder-web.netlify.app)

## Usage

1. Enter one or more names separated by commas, followed by `@` and the company domain
   - Example: `John Doe, Mary Smith @ company.com`
2. Click the **"Search"** button
3. The app will generate multiple email address formats for each name
4. Use the copy buttons to save the addresses to your clipboard  

---

## Project Structure

- `index.html` – Web page structure  
- `script.js` – JavaScript logic for generating and copying email addresses  
- `translations.js` – Multilingual support file  

---

## Technologies Used

- HTML5
- Tailwind CSS
- JavaScript (Vanilla JS)
- Google Fonts (Poppins)

---

## Contributing

Contributions are welcome! Feel free to open an issue or submit a pull request to improve the app.

---

## License

This project is open source and available under the **MIT License**.

---

## Author

[Gaya KACI](https://github.com/gayakaci20)