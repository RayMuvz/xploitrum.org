import React from "react";

export default function App() {
    return (
        <main className="p-8 font-sans">
            <header className="max-w-4xl mx-auto text-center">
                <h1 className="text-4xl font-bold">Xploit RUM — CTF</h1>
                <p className="mt-4">Student-run Capture The Flag platform. Join the CTF at <a href="https://ctf.xploitrum.org" className="underline">ctf.xploitrum.org</a></p>
                <div className="mt-6">
                    <a className="px-4 py-2 bg-blue-600 text-white rounded" href="https://ctf.xploitrum.org">Join CTF</a>
                </div>
            </header>
        </main>
    );
}