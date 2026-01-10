import React from "react";

interface AnimatedTextProps {
  text: string;
  className?: string;
}

export const AnimatedText: React.FC<AnimatedTextProps> = ({ text, className = "" }) => {
  return (
    <span className={className}>
      {text.split("").map((char, index) => (
        <span
          key={index}
          className="inline-block transition-transform duration-200 hover:scale-125 cursor-default"
          style={{ whiteSpace: char === " " ? "pre" : "normal" }}
        >
          {char}
        </span>
      ))}
    </span>
  );
};

interface AnimatedLetterProps {
  letter: string;
  className?: string;
}

export const AnimatedLetter: React.FC<AnimatedLetterProps> = ({ letter, className = "" }) => {
  return (
    <span className={`inline-block transition-transform duration-200 hover:scale-150 cursor-default ${className}`}>
      {letter}
    </span>
  );
};

interface AnimatedWordProps {
  word: string;
  className?: string;
}

export const AnimatedWord: React.FC<AnimatedWordProps> = ({ word, className = "" }) => {
  return (
    <span className={className}>
      {word.split("").map((char, index) => (
        <span
          key={index}
          className="inline-block transition-transform duration-200 hover:scale-125 cursor-default"
        >
          {char}
        </span>
      ))}
    </span>
  );
};
