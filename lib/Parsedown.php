<?php

/**
 * Simplified Parsedown - Markdown Parser for GLPI
 * Based on Parsedown by Emanuil Rusev
 * 
 * For full Parsedown functionality, replace this with the official Parsedown library
 */
class Parsedown
{
    private $safeMode = false;
    private $breaksEnabled = false;

    public function setSafeMode($safeMode)
    {
        $this->safeMode = $safeMode;
        return $this;
    }

    public function setBreaksEnabled($breaksEnabled)
    {
        $this->breaksEnabled = $breaksEnabled;
        return $this;
    }

    public function text($text)
    {
        $text = str_replace("\r\n", "\n", $text);
        $text = str_replace("\r", "\n", $text);
        $text = ltrim($text, "\n");
        $text = rtrim($text);

        $lines = explode("\n", $text);
        $html = $this->parseLines($lines);

        return $html;
    }

    private function parseLines($lines)
    {
        $html = '';
        $inCodeBlock = false;
        $codeBlockLanguage = '';
        $codeBlockContent = '';
        $inList = false;
        $listItems = [];

        foreach ($lines as $line) {
            // Handle code blocks
            if (preg_match('/^```(\w*)/', $line, $matches)) {
                if (!$inCodeBlock) {
                    $inCodeBlock = true;
                    $codeBlockLanguage = $matches[1] ?? '';
                    continue;
                } else {
                    $inCodeBlock = false;
                    $html .= '<pre><code' . ($codeBlockLanguage ? ' class="language-' . $codeBlockLanguage . '"' : '') . '>' . 
                            htmlspecialchars($codeBlockContent) . '</code></pre>';
                    $codeBlockContent = '';
                    $codeBlockLanguage = '';
                    continue;
                }
            }

            if ($inCodeBlock) {
                $codeBlockContent .= $line . "\n";
                continue;
            }

            // Handle list items
            if (preg_match('/^[\s]*[-*+]\s+(.*)/', $line, $matches)) {
                if (!$inList) {
                    $inList = true;
                }
                $listItems[] = $this->parseInline($matches[1]);
                continue;
            } elseif ($inList) {
                // End of list
                $html .= '<ul>';
                foreach ($listItems as $item) {
                    $html .= '<li>' . $item . '</li>';
                }
                $html .= '</ul>';
                $inList = false;
                $listItems = [];
            }

            // Handle headers
            if (preg_match('/^(#{1,6})\s+(.*)/', $line, $matches)) {
                $level = strlen($matches[1]);
                $html .= '<h' . $level . '>' . $this->parseInline($matches[2]) . '</h' . $level . '>';
                continue;
            }

            // Handle blockquotes
            if (preg_match('/^>\s*(.*)/', $line, $matches)) {
                $html .= '<blockquote><p>' . $this->parseInline($matches[1]) . '</p></blockquote>';
                continue;
            }

            // Handle horizontal rules
            if (preg_match('/^[-*_]{3,}$/', trim($line))) {
                $html .= '<hr>';
                continue;
            }

            // Handle empty lines
            if (trim($line) === '') {
                if ($this->breaksEnabled) {
                    $html .= '<br>';
                }
                continue;
            }

            // Regular paragraph
            $html .= '<p>' . $this->parseInline($line) . '</p>';
        }

        // Close any remaining list
        if ($inList) {
            $html .= '<ul>';
            foreach ($listItems as $item) {
                $html .= '<li>' . $item . '</li>';
            }
            $html .= '</ul>';
        }

        return $html;
    }

    private function parseInline($text)
    {
        // Bold
        $text = preg_replace('/\*\*(.*?)\*\*/', '<strong>$1</strong>', $text);
        
        // Italic
        $text = preg_replace('/\*(.*?)\*/', '<em>$1</em>', $text);
        
        // Inline code
        $text = preg_replace('/`(.*?)`/', '<code>$1</code>', $text);
        
        // Links
        $text = preg_replace('/\[([^\]]+)\]\(([^)]+)\)/', '<a href="$2" target="_blank">$1</a>', $text);
        
        // Images
        $text = preg_replace('/!\[([^\]]*)\]\(([^)]+)\)/', '<img src="$2" alt="$1" style="max-width: 100%;">', $text);
        
        // Line breaks
        if ($this->breaksEnabled) {
            $text = preg_replace('/\n/', '<br>', $text);
        }

        return $text;
    }
} 