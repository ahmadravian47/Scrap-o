FROM mcr.microsoft.com/playwright:v1.44.0-jammy

WORKDIR /app

COPY package*.json ./
RUN npm install

# This installs Chromium + dependencies
RUN npx playwright install --with-deps chromium

# Copy the rest of your backend code
COPY . .

EXPOSE 5000

CMD ["node", "index.js"]
