# ----------------------------------------------------------------------------
# NAME
#     set_prompt.sh
#
# SYNOPSIS
#     . set_prompt.sh  [color [user-modifier [host-modifier [path-modifier]]]]
#     . set_prompt.sh  -h | --help
#
# DESCRIPTION
#     Define the color and format of the primary command prompt.  The
#     format includes username@host, followed by a separator character,
#     followed by the current working directory.  The entire prompt is
#     set in square brackets and followed by "$ " or "# " (for root
#     only).  For example:
#         [psamamuels@socrates /home/psamuels]$
#
#     The color argument is used to change the color of the prompt:
#         white, black, red, green, yellow, blue, magenta, cyan, gray
#     The default color is white.  The following special value is also
#     recognized:
#         underlined
#
#     The user, host and path modifier arguments affect the display
#     of only the corresponding component of the prompt:
#         none (default)
#         bright
#         underscored
#         reverse
#
#     If the current working directory is within the user's home
#     directory, it is displayed beginning with ~ instead of the
#     absolute path to the user's home directory.  After this
#     substitution, if the resulting path is too long, it is contracted
#     by replacing one or more characters from the beginning of the
#     path with a continuation marker (eg, "...").  The maximum
#     length of path to display, and the continuation marker, are
#     defined as configuration parameters in the script.
#
#     Here are some sample prompts:
#
#       [psamuels@sfca-dev1 ~]$
#       [psamuels@sfca-dev1 ~/jdev/ccms/ccms/j2ee/war/src/com]$
#       [psamuels@sfca-dev1 ...ms/ccms/j2ee/war/src/com/onefbusa]$
#       [psamuels@sfca-dev1 /softwareEnv/tools/ora9ias/j2ee]$
#       [psamuels@sfca-dev1 .../j2ee/ccms/applications/ccms/ccms]$
#
# NOTE
#     This script is intended to be scripted so the value of the PS1
#     environment variable will persist after it is done running.
#     
# EXAMPLE
#     . set_prompt.sh
#     . set_prompt.sh cyan
#     . set_prompt.sh underlined
#     . set_prompt.sh red bright
#     . set_prompt.sh cyan bright rev under
# ----------------------------------------------------------------------------

mypwd() {
  # config parameters...
  # --------------------
  MAX_PATH_LEN=40     # max length of path to display (including cont. marker)
  ETC=...             # the continuation marker

  # MAX_PATH_LENGTH minus length of ETC
  REMAIN_LEN=$((MAX_PATH_LEN - ${#ETC}))

  x=`pwd`
  x=${x/$HOME/\~}
  if [ ${#x} -gt $MAX_PATH_LEN ]; then
    REMAIN_OFFSET=$(( ${#x} - $REMAIN_LEN ))
    x=$ETC${x:$REMAIN_OFFSET}
  fi
  echo $x
}

case "$1" in
  -h|--help)
    echo "usage: . set_prompt.sh [color [user-modifier [host-modifier [path-modifier]]]]"
    echo "color: white (default), black, red, green, yellow, blue, magenta, cyan, gray, underlined"
    echo "modifier: none, bright, underscore, reverse; also bri, under, rev"
    echo "eg: . set_prompt.sh cyan bright rev under"
    ;;
  *)

    # define color
    case ${1:-white} in
      white)      color=40 ;;
      black)      color=30 ;;
      red)        color=31 ;;
      green)      color=32 ;;
      yellow)     color=33 ;;
      blue)       color=34 ;;
      magenta)    color=35 ;;
      cyan)       color=36 ;;
      gray)       color=37 ;;
      underlined) color=38 ;;
      *)          color=40
      echo "Unrecognized color '$color'; using white instead" ;;
    esac

    # define user modifier
    case ${2:-none} in
      none)                 umodifier=  ;;
      bright|bri)           umodifier=1 ;;
      underscore|under|und) umodifier=4 ;;
      reverse|rev)          umodifier=7 ;;
      *) echo "Unrecognized user modifier '$umodifier'; using none" ;;
    esac

    # define host modifier
    case ${3:-none} in
      none)                 hmodifier=  ;;
      bright|bri)           hmodifier=1 ;;
      underscore|under|und) hmodifier=4 ;;
      reverse|rev)          hmodifier=7 ;;
      *) echo "Unrecognized host modifier '$hmodifier'; using none" ;;
    esac

    # define path modifier
    case ${4:-none} in
      none)                 pmodifier=  ;;
      bright|bri)           pmodifier=1 ;;
      underscore|under|und) pmodifier=4 ;;
      reverse|rev)          pmodifier=7 ;;
      *) echo "Unrecognized modifier '$pmodifier'; using none" ;;
    esac

    # only apply modifier if host name is hammer
    # case "$HOSTNAME" in hammer|hammer.tellme.com) ;; *) modifier= ;; esac

    if [ -z "$umodifier" ]; then
        u="\[\033[${color}m\]\u\[\033[0m\]"
    else
        u="\[\033[${color};${umodifier}m\]\u\[\033[0m\]"
    fi

    at="\[\033[${color}m\]@\[\033[0m\]"

    if [ -z "$hmodifier" ]; then
        h="\[\033[${color}m\]\h\[\033[0m\]"
    else
        h="\[\033[${color};${hmodifier}m\]\h\[\033[0m\]"
    fi

    if [ -z "$pmodifier" ]; then
        p="\[\033[${color}m\] \`mypwd\`\[\033[0m\]"
    else
        p="\[\033[${color};${pmodifier}m\] \`mypwd\`\[\033[0m\]"
    fi

    PS1="[$u$at$h$p]\$ "
    export PS1
    ;;
esac

    # PS1='[\[\033[${color}m\]\u@\[\033[0m\]\[\033[${color};${hmodifier}m\]\h\[\033[0m\]\[\033[${color}m\] `mypwd`\[\033[0m\]]\$ '
