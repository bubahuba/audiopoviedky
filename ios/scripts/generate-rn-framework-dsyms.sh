#!/bin/sh
set -e

# React Native 0.86 ships prebuilt XCFrameworks without bundled dSYMs.
# Xcode 16+ warns during App Store upload; generate matching dSYMs at archive time.

if [ "${CONFIGURATION}" != "Release" ]; then
  exit 0
fi

generate_dsym() {
  framework_name="$1"
  binary_name="$2"
  embedded_binary="${TARGET_BUILD_DIR}/${FRAMEWORKS_FOLDER_PATH}/${framework_name}.framework/${binary_name}"
  dsym_output="${DWARF_DSYM_FOLDER_PATH}/${framework_name}.framework.dSYM"

  if [ -f "${embedded_binary}" ]; then
    framework_binary="${embedded_binary}"
  else
    framework_binary="$(find "${PODS_ROOT}" -path "*${framework_name}.framework/${binary_name}" -type f 2>/dev/null | grep '/ios-arm64/' | head -n 1)"
  fi

  if [ -z "${framework_binary}" ] || [ ! -f "${framework_binary}" ]; then
    echo "warning: ${framework_name} binary not found, skipping dSYM generation"
    return 0
  fi

  need_regen=1

  if [ -d "${dsym_output}" ]; then
    bin_uuids="$(dwarfdump --uuid "${framework_binary}" 2>/dev/null | awk '{print $2}' | sort | tr '\n' ' ')"
    dsym_uuids="$(dwarfdump --uuid "${dsym_output}" 2>/dev/null | awk '{print $2}' | sort | tr '\n' ' ')"

    if [ -n "${bin_uuids}" ] && [ "${bin_uuids}" = "${dsym_uuids}" ]; then
      need_regen=0
      echo "${framework_name} dSYM already present with matching UUID"
    else
      echo "${framework_name} dSYM UUID mismatch; regenerating"
    fi
  else
    echo "${framework_name} dSYM missing; generating"
  fi

  if [ "${need_regen}" -eq 1 ]; then
    rm -rf "${dsym_output}"
    dsymutil "${framework_binary}" -o "${dsym_output}" >/dev/null 2>&1 || true
  fi
}

generate_dsym "React" "React"
generate_dsym "ReactNativeDependencies" "ReactNativeDependencies"
generate_dsym "hermesvm" "hermesvm"

exit 0
