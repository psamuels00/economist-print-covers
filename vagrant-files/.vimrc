" Highlight search matches
set hlsearch

" wft?
autocmd BufReadPost * if line("'\"") > 1 && line("'\"") <= line("$") | exe "normal! g`\"" | endif

" Define status line, always displayed
set statusline=%F%m%r%h%w\ line=%l/%L,\ column=%v\ \ (%p%%)
set laststatus=2

" Enable syntax highlighting with custom color scheme
syntax enable
color pbs

" Backup options, interferes with svn
"set backup
"set backupdir=~/.vim/backup//

" indentation sin the evil tab
set expandtab       "Use softtabstop spaces instead of tab characters for indentation
set shiftwidth=4    "Indent by 4 spaces when using >>, <<, == etc.
set softtabstop=4   "Indent by 4 spaces when pressing <TAB>
set autoindent

" text width for paragraph formatting
"set textwidth=100


" Settings from http://nvie.com/posts/how-i-boosted-my-vim/ ...
" -------------------------------------------------------------

" Custom key character
let mapleader=","

" Quickly edit/reload the vimrc file using ,ev or ,sv
nmap <silent> <leader>ev :e $MYVIMRC<CR>
nmap <silent> <leader>sv :so $MYVIMRC<CR>

" Highlight suspect whitespace
set list
set listchars=tab:>.,trail:.,extends:#,nbsp:.

" Allow scrolling with the mouse
set mouse=a

" Allow use of ; instead of : to begin commands; saves shift key press/release
nnoremap ; :

" Scroll vertically through long, wrapped lines instead of leaping over
nnoremap j gj
nnoremap k gk

" Clear the search buffer when you press ,/
nmap <silent> ,/ :nohlsearch<CR>

" Allow use of jj instead of ESC
:imap jj <Esc>

" show line numbers
" set number

" allow :p instead of :prev
cabbrev p prev

" added for webpack-dev-server
:set backupcopy=yes

