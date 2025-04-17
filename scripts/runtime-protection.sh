#!/bin/bash
# Container Runtime Protection Script
# This script creates and manages seccomp and AppArmor profiles for containers

# Default values
PROFILE_TYPE="seccomp"
PROFILE_NAME=""
CONTAINER_NAME=""
OPERATION="create"
OUTPUT_DIR="./security/profiles"
TEMPLATE_MODE="default"
CUSTOM_PROFILE=""
APP_TYPE="web"
APPLY_TO_CONTAINER=false
VERBOSE=false

# Function to display usage
show_usage() {
  echo "Container Runtime Protection Script"
  echo "Usage: $0 [options]"
  echo ""
  echo "Operations:"
  echo "  --create           Create a new profile (default)"
  echo "  --apply            Apply a profile to a container"
  echo "  --monitor          Monitor a container and generate a profile"
  echo "  --list             List available profiles"
  echo "  --delete           Delete a profile"
  echo ""
  echo "Options:"
  echo "  --type <type>      Profile type: seccomp or apparmor [default: seccomp]"
  echo "  --profile <name>   Profile name"
  echo "  --container <name> Container name"
  echo "  --app-type <type>  Application type: web, api, db, worker [default: web]"
  echo "  --output <dir>     Output directory for profiles [default: ./security/profiles]"
  echo "  --template <mode>  Profile template: default, strict, permissive, custom [default: default]"
  echo "  --custom <file>    Custom profile file path (used with --template custom)"
  echo "  --apply            Apply profile to container (used with --create)"
  echo "  --verbose          Enable verbose output"
  echo "  --help             Show this help message"
  echo ""
  echo "Examples:"
  echo "  # Create a seccomp profile for a web application"
  echo "  $0 --create --type seccomp --profile web-app-profile --app-type web"
  echo ""
  echo "  # Create an AppArmor profile"
  echo "  $0 --create --type apparmor --profile api-profile --app-type api"
  echo ""
  echo "  # Apply a profile to a container"
  echo "  $0 --apply --type seccomp --profile web-app-profile --container my-web-app"
  echo ""
  echo "  # Monitor a container to generate a profile"
  echo "  $0 --monitor --type seccomp --profile web-app-profile --container my-web-app"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    --create)
      OPERATION="create"
      shift
      ;;
    --apply)
      if [[ "$OPERATION" == "create" ]]; then
        APPLY_TO_CONTAINER=true
      else
        OPERATION="apply"
      fi
      shift
      ;;
    --monitor)
      OPERATION="monitor"
      shift
      ;;
    --list)
      OPERATION="list"
      shift
      ;;
    --delete)
      OPERATION="delete"
      shift
      ;;
    --type)
      PROFILE_TYPE="$2"
      shift 2
      ;;
    --profile)
      PROFILE_NAME="$2"
      shift 2
      ;;
    --container)
      CONTAINER_NAME="$2"
      shift 2
      ;;
    --app-type)
      APP_TYPE="$2"
      shift 2
      ;;
    --output)
      OUTPUT_DIR="$2"
      shift 2
      ;;
    --template)
      TEMPLATE_MODE="$2"
      shift 2
      ;;
    --custom)
      CUSTOM_PROFILE="$2"
      shift 2
      ;;
    --verbose)
      VERBOSE=true
      shift
      ;;
    --help)
      show_usage
      exit 0
      ;;
    *)
      echo "Error: Unknown option: $1"
      show_usage
      exit 1
      ;;
  esac
done

# Validate profile type
if [[ "$PROFILE_TYPE" != "seccomp" && "$PROFILE_TYPE" != "apparmor" ]]; then
  echo "Error: Profile type must be 'seccomp' or 'apparmor'"
  exit 1
fi

# Create output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR/$PROFILE_TYPE"

# Check if Docker is installed
check_docker() {
  if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed"
    exit 1
  fi
}

# Check if a container exists
check_container() {
  local container_name="$1"
  
  if ! docker ps -a --format '{{.Names}}' | grep -q "^$container_name$"; then
    echo "Error: Container not found: $container_name"
    exit 1
  fi
}

# List available profiles
list_profiles() {
  echo "Available profiles:"
  echo ""
  
  # List seccomp profiles
  echo "Seccomp profiles:"
  if [[ -d "$OUTPUT_DIR/seccomp" ]]; then
    ls -la "$OUTPUT_DIR/seccomp" | grep -v "^total"
  else
    echo "  No seccomp profiles found"
  fi
  echo ""
  
  # List AppArmor profiles
  echo "AppArmor profiles:"
  if [[ -d "$OUTPUT_DIR/apparmor" ]]; then
    ls -la "$OUTPUT_DIR/apparmor" | grep -v "^total"
  else
    echo "  No AppArmor profiles found"
  fi
  echo ""
  
  # List applied profiles
  echo "Applied profiles:"
  docker ps --quiet | xargs -I{} docker inspect --format '{{.Name}}: {{.HostConfig.SecurityOpt}}' {} | sed 's/^\///'
}

# Create a seccomp profile
create_seccomp_profile() {
  local profile_name="$1"
  local app_type="$2"
  local template_mode="$3"
  local custom_profile="$4"
  
  # Full path to profile file
  local profile_path="$OUTPUT_DIR/seccomp/$profile_name.json"
  
  if [[ -f "$profile_path" ]]; then
    echo "Error: Profile already exists: $profile_path"
    echo "Use --delete to remove it first"
    exit 1
  fi
  
  if [[ "$VERBOSE" == true ]]; then
    echo "Creating seccomp profile: $profile_name"
    echo "Application type: $app_type"
    echo "Template mode: $template_mode"
    echo "Output file: $profile_path"
  fi
  
  # Check for custom profile
  if [[ "$template_mode" == "custom" ]]; then
    if [[ -f "$custom_profile" ]]; then
      cp "$custom_profile" "$profile_path"
      echo "Custom seccomp profile created: $profile_path"
      return 0
    else
      echo "Error: Custom profile not found: $custom_profile"
      exit 1
    fi
  fi
  
  # Start with basic structure
  cat << EOF > "$profile_path"
{
  "defaultAction": "SCMP_ACT_ERRNO",
  "architectures": [
    "SCMP_ARCH_X86_64",
    "SCMP_ARCH_X86",
    "SCMP_ARCH_X32",
    "SCMP_ARCH_AARCH64"
  ],
  "syscalls": [
EOF
  
  # Add common syscalls for all applications
  cat << EOF >> "$profile_path"
    {
      "names": [
        "accept",
        "accept4",
        "access",
        "arch_prctl",
        "bind",
        "brk",
        "capget",
        "capset",
        "chdir",
        "chmod",
        "chown",
        "clock_getres",
        "clock_gettime",
        "clock_nanosleep",
        "close",
        "connect",
        "copy_file_range",
        "creat",
        "dup",
        "dup2",
        "dup3",
        "epoll_create",
        "epoll_create1",
        "epoll_ctl",
        "epoll_ctl_old",
        "epoll_pwait",
        "epoll_wait",
        "epoll_wait_old",
        "eventfd",
        "eventfd2",
        "execve",
        "execveat",
        "exit",
        "exit_group",
        "faccessat",
        "fadvise64",
        "fallocate",
        "fanotify_mark",
        "fchdir",
        "fchmod",
        "fchmodat",
        "fchown",
        "fchownat",
        "fcntl",
        "fdatasync",
        "fgetxattr",
        "flistxattr",
        "flock",
        "fork",
        "fremovexattr",
        "fsetxattr",
        "fstat",
        "fstatfs",
        "fsync",
        "ftruncate",
        "futex",
        "getcpu",
        "getcwd",
        "getdents",
        "getdents64",
        "getegid",
        "geteuid",
        "getgid",
        "getgroups",
        "getitimer",
        "getpeername",
        "getpgid",
        "getpgrp",
        "getpid",
        "getppid",
        "getpriority",
        "getrandom",
        "getresgid",
        "getresuid",
        "getrlimit",
        "getrusage",
        "getsid",
        "getsockname",
        "getsockopt",
        "gettid",
        "gettimeofday",
        "getuid",
        "getxattr",
        "inotify_add_watch",
        "inotify_init",
        "inotify_init1",
        "inotify_rm_watch",
        "io_cancel",
        "io_destroy",
        "io_getevents",
        "io_setup",
        "io_submit",
        "ioctl",
        "ioprio_get",
        "ioprio_set",
        "kill",
        "lchown",
        "lgetxattr",
        "link",
        "linkat",
        "listen",
        "listxattr",
        "llistxattr",
        "lremovexattr",
        "lseek",
        "lsetxattr",
        "lstat",
        "madvise",
        "memfd_create",
        "mincore",
        "mkdir",
        "mkdirat",
        "mknod",
        "mknodat",
        "mlock",
        "mlock2",
        "mlockall",
        "mmap",
        "mprotect",
        "mq_getsetattr",
        "mq_notify",
        "mq_open",
        "mq_timedreceive",
        "mq_timedsend",
        "mq_unlink",
        "mremap",
        "msgget",
        "msgrcv",
        "msgsnd",
        "msync",
        "munlock",
        "munlockall",
        "munmap",
        "nanosleep",
        "newfstatat",
        "open",
        "openat",
        "pause",
        "pipe",
        "pipe2",
        "poll",
        "ppoll",
        "prctl",
        "pread64",
        "preadv",
        "preadv2",
        "prlimit64",
        "pselect6",
        "pwrite64",
        "pwritev",
        "pwritev2",
        "read",
        "readahead",
        "readlink",
        "readlinkat",
        "readv",
        "recvfrom",
        "recvmmsg",
        "recvmsg",
        "rename",
        "renameat",
        "renameat2",
        "restart_syscall",
        "rmdir",
        "rt_sigaction",
        "rt_sigpending",
        "rt_sigprocmask",
        "rt_sigqueueinfo",
        "rt_sigreturn",
        "rt_sigsuspend",
        "rt_sigtimedwait",
        "rt_tgsigqueueinfo",
        "sched_get_priority_max",
        "sched_get_priority_min",
        "sched_getaffinity",
        "sched_getattr",
        "sched_getparam",
        "sched_getscheduler",
        "sched_rr_get_interval",
        "sched_setaffinity",
        "sched_setattr",
        "sched_setparam",
        "sched_setscheduler",
        "sched_yield",
        "seccomp",
        "select",
        "semctl",
        "semget",
        "semop",
        "semtimedop",
        "sendfile",
        "sendmmsg",
        "sendmsg",
        "sendto",
        "set_robust_list",
        "set_tid_address",
        "setgid",
        "setgroups",
        "setitimer",
        "setpgid",
        "setpriority",
        "setregid",
        "setresgid",
        "setresuid",
        "setreuid",
        "setrlimit",
        "setsid",
        "setsockopt",
        "setuid",
        "shmat",
        "shmctl",
        "shmdt",
        "shmget",
        "shutdown",
        "sigaltstack",
        "signalfd",
        "signalfd4",
        "socket",
        "socketpair",
        "splice",
        "stat",
        "statfs",
        "statx",
        "symlink",
        "symlinkat",
        "sync",
        "sync_file_range",
        "syncfs",
        "sysinfo",
        "tee",
        "tgkill",
        "time",
        "timer_create",
        "timer_delete",
        "timer_getoverrun",
        "timer_gettime",
        "timer_settime",
        "timerfd_create",
        "timerfd_gettime",
        "timerfd_settime",
        "times",
        "tkill",
        "truncate",
        "umask",
        "uname",
        "unlink",
        "unlinkat",
        "utime",
        "utimensat",
        "utimes",
        "vfork",
        "vmsplice",
        "wait4",
        "waitid",
        "waitpid",
        "write",
        "writev"
      ],
      "action": "SCMP_ACT_ALLOW"
    }
EOF
  
  # Add specific syscalls based on application type
  case "$app_type" in
    web)
      # Web applications typically need networking
      if [[ "$template_mode" == "permissive" ]]; then
        cat << EOF >> "$profile_path"
    },
    {
      "names": [
        "mount",
        "umount",
        "umount2",
        "ptrace",
        "process_vm_readv",
        "process_vm_writev",
        "personality",
        "syslog"
      ],
      "action": "SCMP_ACT_ALLOW"
EOF
      fi
      ;;
      
    db)
      # Database applications need filesystem access
      cat << EOF >> "$profile_path"
    },
    {
      "names": [
        "mount",
        "umount",
        "umount2",
        "fsconfig",
        "fsmount",
        "fsopen",
        "fspick",
        "move_mount",
        "open_tree",
        "swapon",
        "swapoff"
      ],
      "action": "SCMP_ACT_ALLOW"
EOF
      ;;
      
    worker)
      # Worker applications may need additional capabilities
      cat << EOF >> "$profile_path"
    },
    {
      "names": [
        "clone",
        "clone3",
        "keyctl",
        "add_key",
        "request_key",
        "mbind",
        "migrate_pages",
        "move_pages",
        "set_mempolicy",
        "get_mempolicy"
      ],
      "action": "SCMP_ACT_ALLOW"
EOF
      ;;
      
    api)
      # API applications typically need networking
      if [[ "$template_mode" == "permissive" ]]; then
        cat << EOF >> "$profile_path"
    },
    {
      "names": [
        "process_vm_readv",
        "process_vm_writev",
        "personality"
      ],
      "action": "SCMP_ACT_ALLOW"
EOF
      fi
      ;;
  esac
  
  # Add strict mode restrictions
  if [[ "$template_mode" == "strict" ]]; then
    cat << EOF >> "$profile_path"
    },
    {
      "names": [
        "chmod",
        "fchmod",
        "fchmodat",
        "chown",
        "fchown",
        "fchownat",
        "lchown"
      ],
      "action": "SCMP_ACT_ERRNO"
EOF
  fi
  
  # Close the JSON structure
  echo "    }" >> "$profile_path"
  echo "  ]" >> "$profile_path"
  echo "}" >> "$profile_path"
  
  echo "Created seccomp profile: $profile_path"
  
  if [[ "$APPLY_TO_CONTAINER" == true && -n "$CONTAINER_NAME" ]]; then
    apply_seccomp_profile "$profile_name" "$CONTAINER_NAME"
  fi
}

# Create an AppArmor profile
create_apparmor_profile() {
  local profile_name="$1"
  local app_type="$2"
  local template_mode="$3"
  local custom_profile="$4"
  
  # Full path to profile file
  local profile_path="$OUTPUT_DIR/apparmor/$profile_name"
  
  if [[ -f "$profile_path" ]]; then
    echo "Error: Profile already exists: $profile_path"
    echo "Use --delete to remove it first"
    exit 1
  fi
  
  if [[ "$VERBOSE" == true ]]; then
    echo "Creating AppArmor profile: $profile_name"
    echo "Application type: $app_type"
    echo "Template mode: $template_mode"
    echo "Output file: $profile_path"
  fi
  
  # Check for custom profile
  if [[ "$template_mode" == "custom" ]]; then
    if [[ -f "$custom_profile" ]]; then
      cp "$custom_profile" "$profile_path"
      echo "Custom AppArmor profile created: $profile_path"
      return 0
    else
      echo "Error: Custom profile not found: $custom_profile"
      exit 1
    fi
  fi
  
  # Start with basic structure
  cat << EOF > "$profile_path"
#include <tunables/global>

profile $profile_name flags=(attach_disconnected, mediate_deleted) {
  #include <abstractions/base>
  #include <abstractions/nameservice>
EOF
  
  # Add common includes
  cat << EOF >> "$profile_path"
  # Allow network access
  network inet tcp,
  network inet udp,
  network inet icmp,
  
  # Allow process operations
  capability chown,
  capability dac_override,
  capability setuid,
  capability setgid,
  capability net_bind_service,
  
  # Deny certain capabilities
  deny capability sys_admin,
  deny capability sys_ptrace,
  deny capability sys_module,
EOF
  
  # Add specific rules based on application type
  case "$app_type" in
    web)
      # Web applications typically need filesystem access
      cat << EOF >> "$profile_path"
  # Web application permissions
  /var/www/** r,
  /app/** r,
  /app/public/** r,
  /app/uploads/** rw,
  /app/tmp/** rw,
  /app/logs/** rw,
EOF
      ;;
      
    db)
      # Database applications need data directory access
      cat << EOF >> "$profile_path"
  # Database application permissions
  /var/lib/postgres/** rwk,
  /data/** rwk,
  /app/data/** rwk,
  /tmp/** rwk,
  
  # Database needs to create and manage files
  capability fowner,
  capability fsetid,
EOF
      ;;
      
    worker)
      # Worker applications may need additional permissions
      cat << EOF >> "$profile_path"
  # Worker application permissions
  /app/** rw,
  /var/tmp/** rw,
  /tmp/** rw,
  /proc/*/stat r,
  /proc/*/cmdline r,
  /proc/*/status r,
EOF
      ;;
      
    api)
      # API applications typically need limited filesystem access
      cat << EOF >> "$profile_path"
  # API application permissions
  /app/** r,
  /app/logs/** w,
  /app/tmp/** rw,
EOF
      ;;
  esac
  
  # Add template-specific rules
  case "$template_mode" in
    strict)
      # Strict mode has more restrictions
      cat << EOF >> "$profile_path"
  # Strict mode restrictions
  deny /bin/** wl,
  deny /sbin/** wl,
  deny /usr/bin/** wl,
  deny /usr/sbin/** wl,
  deny /etc/** wl,
  deny /root/** rwl,
  deny /var/log/** wl,
  deny /proc/** wl,
  deny /sys/** wl,
  
  # No mounting
  deny mount,
  deny umount,
  
  # No module loading
  deny /lib/modules/** r,
EOF
      ;;
      
    permissive)
      # Permissive mode has fewer restrictions
      cat << EOF >> "$profile_path"
  # Permissive mode permissions
  /bin/** r,
  /sbin/** r,
  /usr/bin/** r,
  /usr/sbin/** r,
  /etc/** r,
  /var/log/** r,
  /proc/** r,
  /sys/** r,
EOF
      ;;
      
    default)
      # Default mode has balanced restrictions
      cat << EOF >> "$profile_path"
  # Default mode permissions
  /bin/** r,
  /sbin/** r,
  /usr/bin/** r,
  /usr/sbin/** r,
  /etc/** r,
  deny /etc/shadow rw,
  deny /etc/gshadow rw,
  deny /etc/passwd w,
  deny /etc/group w,
  
  deny mount,
  deny umount,
EOF
      ;;
  esac
  
  # Close the profile
  cat << EOF >> "$profile_path"
  # Common read-only directories
  /lib/** r,
  /lib64/** r,
  /usr/lib/** r,
  /usr/lib64/** r,
  /usr/share/** r,
  
  # Common rules for container environments
  /dev/null rw,
  /dev/zero r,
  /dev/full rw,
  /dev/random r,
  /dev/urandom r,
  /dev/tty rw,
  /dev/console rw,
  
  # Docker specific
  deny @{PROC}/@{pid}/oom_score_adj w,
  @{PROC}/sys/kernel/random/uuid r,
}
EOF
  
  echo "Created AppArmor profile: $profile_path"
  
  # Load the AppArmor profile if apparmor_parser is available
  if command -v apparmor_parser &> /dev/null; then
    if [[ "$VERBOSE" == true ]]; then
      echo "Loading AppArmor profile..."
    fi
    
    apparmor_parser -r -W "$profile_path"
    
    if [[ $? -eq 0 ]]; then
      echo "AppArmor profile loaded successfully"
    else
      echo "Warning: Failed to load AppArmor profile"
    fi
  else
    echo "Warning: apparmor_parser not found - profile not loaded"
  fi
  
  if [[ "$APPLY_TO_CONTAINER" == true && -n "$CONTAINER_NAME" ]]; then
    apply_apparmor_profile "$profile_name" "$CONTAINER_NAME"
  fi
}

# Apply a seccomp profile to a container
apply_seccomp_profile() {
  local profile_name="$1"
  local container_name="$2"
  
  # Check if container exists
  check_container "$container_name"
  
  # Profile path
  local profile_path="$OUTPUT_DIR/seccomp/$profile_name.json"
  
  if [[ ! -f "$profile_path" ]]; then
    echo "Error: Profile not found: $profile_path"
    exit 1
  fi
  
  if [[ "$VERBOSE" == true ]]; then
    echo "Applying seccomp profile to container: $container_name"
    echo "Profile: $profile_path"
  fi
  
  # Get container image name
  local image_name=$(docker inspect --format '{{.Config.Image}}' "$container_name")
  
  # Get container command
  local container_command=$(docker inspect --format '{{.Config.Cmd}}' "$container_name")
  
  # Get container ports
  local container_ports=$(docker inspect --format '{{range $p, $conf := .NetworkSettings.Ports}}{{$p}} {{end}}' "$container_name")
  
  # Get container volumes
  local container_volumes=$(docker inspect --format '{{range .Mounts}}{{.Source}}:{{.Destination}} {{end}}' "$container_name")
  
  # Get environment variables
  local container_env=$(docker inspect --format '{{range .Config.Env}}{{.}} {{end}}' "$container_name")
  
  # Stop the container
  echo "Stopping container: $container_name"
  docker stop "$container_name"
  
  # Remove the container (keep volumes)
  echo "Removing container: $container_name"
  docker rm "$container_name"
  
  # Run the container with the seccomp profile
  echo "Starting container with seccomp profile..."
  
  # Build docker run command
  local docker_cmd="docker run -d --name $container_name"
  
  # Add ports
  for port in $container_ports; do
    docker_cmd="$docker_cmd -p $port"
  done
  
  # Add volumes
  for volume in $container_volumes; do
    docker_cmd="$docker_cmd -v $volume"
  done
  
  # Add environment variables
  for env in $container_env; do
    docker_cmd="$docker_cmd -e $env"
  done
  
  # Add seccomp profile
  docker_cmd="$docker_cmd --security-opt seccomp=$profile_path"
  
  # Add image and command
  docker_cmd="$docker_cmd $image_name $container_command"
  
  # Execute the command
  if [[ "$VERBOSE" == true ]]; then
    echo "Running command: $docker_cmd"
  fi
  
  eval "$docker_cmd"
  
  if [[ $? -eq 0 ]]; then
    echo "Container started with seccomp profile"
  else
    echo "Error: Failed to start container with seccomp profile"
    echo "Reverting to original container configuration..."
    
    # Run the container without the seccomp profile
    local docker_cmd="docker run -d --name $container_name"
    
    # Add ports
    for port in $container_ports; do
      docker_cmd="$docker_cmd -p $port"
    done
    
    # Add volumes
    for volume in $container_volumes; do
      docker_cmd="$docker_cmd -v $volume"
    done
    
    # Add environment variables
    for env in $container_env; do
      docker_cmd="$docker_cmd -e $env"
    done
    
    # Add image and command
    docker_cmd="$docker_cmd $image_name $container_command"
    
    eval "$docker_cmd"
    
    if [[ $? -eq 0 ]]; then
      echo "Container started without seccomp profile"
    else
      echo "Error: Failed to start container"
    fi
  fi
}

# Apply an AppArmor profile to a container
apply_apparmor_profile() {
  local profile_name="$1"
  local container_name="$2"
  
  # Check if container exists
  check_container "$container_name"
  
  # Profile path
  local profile_path="$OUTPUT_DIR/apparmor/$profile_name"
  
  if [[ ! -f "$profile_path" ]]; then
    echo "Error: Profile not found: $profile_path"
    exit 1
  fi
  
  if [[ "$VERBOSE" == true ]]; then
    echo "Applying AppArmor profile to container: $container_name"
    echo "Profile: $profile_path"
  fi
  
  # Check if AppArmor is available
  if ! command -v apparmor_parser &> /dev/null; then
    echo "Error: AppArmor not available on this system"
    exit 1
  fi
  
  # Load the AppArmor profile
  echo "Loading AppArmor profile..."
  apparmor_parser -r -W "$profile_path"
  
  if [[ $? -ne 0 ]]; then
    echo "Error: Failed to load AppArmor profile"
    exit 1
  fi
  
  # Get container image name
  local image_name=$(docker inspect --format '{{.Config.Image}}' "$container_name")
  
  # Get container command
  local container_command=$(docker inspect --format '{{.Config.Cmd}}' "$container_name")
  
  # Get container ports
  local container_ports=$(docker inspect --format '{{range $p, $conf := .NetworkSettings.Ports}}{{$p}} {{end}}' "$container_name")
  
  # Get container volumes
  local container_volumes=$(docker inspect --format '{{range .Mounts}}{{.Source}}:{{.Destination}} {{end}}' "$container_name")
  
  # Get environment variables
  local container_env=$(docker inspect --format '{{range .Config.Env}}{{.}} {{end}}' "$container_name")
  
  # Stop the container
  echo "Stopping container: $container_name"
  docker stop "$container_name"
  
  # Remove the container (keep volumes)
  echo "Removing container: $container_name"
  docker rm "$container_name"
  
  # Run the container with the AppArmor profile
  echo "Starting container with AppArmor profile..."
  
  # Build docker run command
  local docker_cmd="docker run -d --name $container_name"
  
  # Add ports
  for port in $container_ports; do
    docker_cmd="$docker_cmd -p $port"
  done
  
  # Add volumes
  for volume in $container_volumes; do
    docker_cmd="$docker_cmd -v $volume"
  done
  
  # Add environment variables
  for env in $container_env; do
    docker_cmd="$docker_cmd -e $env"
  done
  
  # Add AppArmor profile
  docker_cmd="$docker_cmd --security-opt apparmor=$profile_name"
  
  # Add image and command
  docker_cmd="$docker_cmd $image_name $container_command"
  
  # Execute the command
  if [[ "$VERBOSE" == true ]]; then
    echo "Running command: $docker_cmd"
  fi
  
  eval "$docker_cmd"
  
  if [[ $? -eq 0 ]]; then
    echo "Container started with AppArmor profile"
  else
    echo "Error: Failed to start container with AppArmor profile"
    echo "Reverting to original container configuration..."
    
    # Run the container without the AppArmor profile
    local docker_cmd="docker run -d --name $container_name"
    
    # Add ports
    for port in $container_ports; do
      docker_cmd="$docker_cmd -p $port"
    done
    
    # Add volumes
    for volume in $container_volumes; do
      docker_cmd="$docker_cmd -v $volume"
    done
    
    # Add environment variables
    for env in $container_env; do
      docker_cmd="$docker_cmd -e $env"
    done
    
    # Add image and command
    docker_cmd="$docker_cmd $image_name $container_command"
    
    eval "$docker_cmd"
    
    if [[ $? -eq 0 ]]; then
      echo "Container started without AppArmor profile"
    else
      echo "Error: Failed to start container"
    fi
  fi
}

# Monitor a container and generate a profile
monitor_container() {
  local profile_type="$1"
  local profile_name="$2"
  local container_name="$3"
  
  # Check if container exists
  check_container "$container_name"
  
  if [[ "$VERBOSE" == true ]]; then
    echo "Monitoring container: $container_name"
    echo "Profile type: $profile_type"
    echo "Profile name: $profile_name"
  fi
  
  case "$profile_type" in
    seccomp)
      echo "Error: Container monitoring for seccomp is not implemented yet"
      echo "Consider using Docker's seccomp profile generation:"
      echo "https://docs.docker.com/engine/security/seccomp/"
      ;;
      
    apparmor)
      echo "Error: Container monitoring for AppArmor is not implemented yet"
      echo "Consider using aa-genprof for AppArmor profile generation"
      ;;
      
    *)
      echo "Error: Unknown profile type: $profile_type"
      exit 1
      ;;
  esac
}

# Delete a profile
delete_profile() {
  local profile_type="$1"
  local profile_name="$2"
  
  case "$profile_type" in
    seccomp)
      local profile_path="$OUTPUT_DIR/seccomp/$profile_name.json"
      
      if [[ ! -f "$profile_path" ]]; then
        echo "Error: Profile not found: $profile_path"
        exit 1
      fi
      
      rm "$profile_path"
      echo "Deleted seccomp profile: $profile_path"
      ;;
      
    apparmor)
      local profile_path="$OUTPUT_DIR/apparmor/$profile_name"
      
      if [[ ! -f "$profile_path" ]]; then
        echo "Error: Profile not found: $profile_path"
        exit 1
      fi
      
      # Remove from AppArmor if available
      if command -v apparmor_parser &> /dev/null; then
        apparmor_parser -R "$profile_path" 2>/dev/null
      fi
      
      rm "$profile_path"
      echo "Deleted AppArmor profile: $profile_path"
      ;;
      
    *)
      echo "Error: Unknown profile type: $profile_type"
      exit 1
      ;;
  esac
}

# Main logic
check_docker

case "$OPERATION" in
  create)
    if [[ -z "$PROFILE_NAME" ]]; then
      echo "Error: Profile name is required"
      show_usage
      exit 1
    fi
    
    case "$PROFILE_TYPE" in
      seccomp)
        create_seccomp_profile "$PROFILE_NAME" "$APP_TYPE" "$TEMPLATE_MODE" "$CUSTOM_PROFILE"
        ;;
      apparmor)
        create_apparmor_profile "$PROFILE_NAME" "$APP_TYPE" "$TEMPLATE_MODE" "$CUSTOM_PROFILE"
        ;;
      *)
        echo "Error: Unknown profile type: $PROFILE_TYPE"
        exit 1
        ;;
    esac
    ;;
    
  apply)
    if [[ -z "$PROFILE_NAME" ]]; then
      echo "Error: Profile name is required"
      show_usage
      exit 1
    fi
    
    if [[ -z "$CONTAINER_NAME" ]]; then
      echo "Error: Container name is required"
      show_usage
      exit 1
    fi
    
    case "$PROFILE_TYPE" in
      seccomp)
        apply_seccomp_profile "$PROFILE_NAME" "$CONTAINER_NAME"
        ;;
      apparmor)
        apply_apparmor_profile "$PROFILE_NAME" "$CONTAINER_NAME"
        ;;
      *)
        echo "Error: Unknown profile type: $PROFILE_TYPE"
        exit 1
        ;;
    esac
    ;;
    
  monitor)
    if [[ -z "$PROFILE_NAME" ]]; then
      echo "Error: Profile name is required"
      show_usage
      exit 1
    fi
    
    if [[ -z "$CONTAINER_NAME" ]]; then
      echo "Error: Container name is required"
      show_usage
      exit 1
    fi
    
    monitor_container "$PROFILE_TYPE" "$PROFILE_NAME" "$CONTAINER_NAME"
    ;;
    
  list)
    list_profiles
    ;;
    
  delete)
    if [[ -z "$PROFILE_NAME" ]]; then
      echo "Error: Profile name is required"
      show_usage
      exit 1
    fi
    
    delete_profile "$PROFILE_TYPE" "$PROFILE_NAME"
    ;;
    
  *)
    echo "Error: Unknown operation: $OPERATION"
    show_usage
    exit 1
    ;;
esac

exit 0