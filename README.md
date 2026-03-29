# NutriSaathi AI - Production Ready

NutriSaathi AI is a modern, AI-powered food health analyzer built with Next.js 15, Genkit, and Firebase. This project is now structured for easy export and deployment.

## 🚀 How to Export

To download the full project as a ZIP file:
1. Locate the **Export** or **Download** icon in the Firebase Studio sidebar or header.
2. Select **Download Project as ZIP**.
3. Extract the contents on your local machine.

## 🛠️ Local Setup

Once downloaded, you can run the project locally:

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Environment Variables**:
    Create a `.env.local` file in the root and add your Gemini API Key:
    ```env
    GOOGLE_GENAI_API_KEY=your_gemini_api_key_here
    ```

3.  **Run Development Server**:
    ```bash
    npm run dev
    ```

## 📦 Deployment to Vercel

1. Push the extracted code to a GitHub/GitLab/Bitbucket repository.
2. Import the project into **Vercel**.
3. Add the `GOOGLE_GENAI_API_KEY` to the **Environment Variables** in Vercel project settings.
4. Vercel will automatically detect the Next.js settings and deploy your application.

## ✨ Features
- **Multilingual Search**: Support for 11 regional Indian languages.
- **Voice Intelligence**: Localized voice search and health verdict audio.
- **Basket Audit**: AI-powered shopping cart analysis and smart swaps.
- **Personalized Insights**: Tailored reports based on user health profiles.

Built with ❤️ for Indian Food Intelligence.