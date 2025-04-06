{pkgs}: {
  deps = [
    pkgs.jq
    pkgs.zstd
    pkgs.rsync
    pkgs.ffmpeg
    pkgs.unzip
    pkgs.postgresql
    pkgs.lsof
  ];
}
