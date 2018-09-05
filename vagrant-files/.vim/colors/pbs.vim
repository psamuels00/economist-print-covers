" Vim color file
" Maintainer:	Bram Moolenaar <Bram@vim.org>
" Last Change:	2001 Jul 23

" This is the default color scheme.  It doesn't define the Normal
" highlighting, it uses whatever the colors used to be.

" Set 'background' back to the default.  The value can't always be estimated
" and is then guessed.
hi clear Normal
set bg&

" Remove all existing highlighting and set the defaults.
hi clear

" Load the syntax highlighting defaults, if it's enabled.
if exists("syntax_on")
  syntax reset
endif

let colors_name = "pbs"

" vim: sw=2

" Enable 16 colors in xterm
if has("terminfo")
  set t_Co=16
  set t_AB=[%?%p1%{8}%<%t%p1%{40}%+%e%p1%{92}%+%;%dm
  set t_AF=[%?%p1%{8}%<%t%p1%{30}%+%e%p1%{82}%+%;%dm
else
  set t_Co=16
  set t_Sf=[3%dm
  set t_Sb=[4%dm
endif

" Colors for syntax highlighting
hi Comment     ctermfg=DarkGray
hi Constant    ctermfg=DarkYellow
hi Special     ctermfg=DarkMagenta   " regex and escape characters like \d or \n
hi Identifier  ctermfg=DarkCyan
hi Statement   ctermfg=Gray
hi Function    ctermfg=White         " not working!
hi PreProc     ctermfg=DarkMagenta
hi Type        ctermfg=DarkGreen
hi Ignore      ctermfg=Black     ctermbg=Gray
hi Error       ctermfg=Gray      ctermbg=DarkRed
hi Todo        ctermfg=Black     ctermbg=DarkRed
hi Search      ctermfg=Cyan      ctermbg=Blue

" set cursorline
" hi CursorLine  cterm=NONE ctermfg=White     ctermbg=DarkGray
hi Cursor      cterm=NONE ctermfg=LightRed  ctermbg=White
