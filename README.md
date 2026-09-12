This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## for Buidling and deployemnt

## for MAC OS.
npm run build
cp -r public .next/standalone/
cp -r .next/static .next/standalone/.next/
cd .next/standalone && PORT=3000 node server.js

## for Windows.
npm run build
Copy-Item -Recurse public .next\standalone\public
Copy-Item -Recurse .next\static .next\standalone\.next\static
cd .next\standalone; $env:PORT=3000; node server.js


## create zip file and uplaod the zip file.
now create a zip by this command.
tar -a -c -f deploy.zip -C .next/standalone .

copy the zip file and upload on hosting. 


