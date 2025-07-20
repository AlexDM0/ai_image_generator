# OpenAI Image Playground

A modern web application built with Bun, Express, TypeScript, and OpenAI's DALL-E API for generating images from text prompts.

## Features

- 🎨 Generate images using OpenAI's DALL-E model
- 🚀 Fast development with Bun runtime
- 💪 Type-safe with TypeScript
- 🎯 Clean, responsive web interface
- 🔒 Environment variable configuration
- ⚡ Express.js backend with REST API

## Prerequisites

- [Bun](https://bun.sh/) installed on your system
- OpenAI API key (get one from [OpenAI Platform](https://platform.openai.com/))

## Installation

1. Clone or download this project
2. Install dependencies:
   ```bash
   bun install
   ```

3. Create a `.env` file in the root directory and add your OpenAI API key:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   ```

## Usage

1. Start the development server:
   ```bash
   bun run dev
   ```

2. Open your browser and navigate to `http://localhost:3000`

3. Enter a description of the image you want to generate in the textarea

4. Click "Generate Image" and wait for your AI-generated image to appear

## Project Structure

```
├── src/
│   └── server.ts          # Express server with OpenAI integration
├── public/
│   ├── index.html         # Main HTML page
│   ├── styles.css         # Styling for the web interface
│   └── app.js            # Frontend JavaScript
├── .env                   # Environment variables (create this)
├── package.json          # Project dependencies and scripts
├── tsconfig.json         # TypeScript configuration
└── README.md             # This file
```

## API Endpoints

### POST `/api/generate-image`

Generate an image from a text prompt.

**Request Body:**
```json
{
  "prompt": "A beautiful sunset over mountains"
}
```

**Response:**
```json
{
  "imageUrl": "https://..."
}
```

## Scripts

- `bun run dev` - Start development server
- `bun run build` - Compile TypeScript to JavaScript
- `bun run start` - Run compiled JavaScript

## Technologies Used

- **Runtime:** Bun
- **Backend:** Express.js with TypeScript
- **AI:** OpenAI DALL-E API
- **Frontend:** Vanilla HTML, CSS, JavaScript
- **Environment:** dotenv for configuration

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | Your OpenAI API key | Yes |

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Troubleshooting

### Common Issues

1. **"Cannot find module" errors**: Run `bun install` to install dependencies
2. **API key errors**: Make sure your `.env` file contains a valid OpenAI API key
3. **Port already in use**: The server runs on port 3000 by default. Make sure no other service is using this port.

### Getting Help

If you encounter issues:
1. Check that all dependencies are installed
2. Verify your OpenAI API key is valid and has sufficient credits
3. Check the browser console for any JavaScript errors
4. Check the server logs for any backend errors

## Acknowledgments

- OpenAI for providing the DALL-E API
- Bun team for the amazing JavaScript runtime
- Express.js community for the robust web framework
