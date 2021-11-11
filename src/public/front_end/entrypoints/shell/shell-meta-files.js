// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import '../../core/sdk/sdk-meta.js';
import '../../models/logs/logs-meta.js';
import '../../models/persistence/persistence-meta.js';
// import '../../panels/changes/changes-meta.js';
import '../../panels/console/console-meta.js';
import '../../panels/console_counters/console_counters-meta.js';
// import '../../panels/coverage/coverage-meta.js';
// import '../../panels/core_memory/core_memory-meta.js';
import '../../panels/input/input-meta.js';
// import '../../panels/profiler/profiler-meta.js';
// import '../../panels/protocol_monitor/protocol_monitor-meta.js';
import '../../panels/settings/settings-meta.js';
// import '../../panels/sources/sources-meta.js';
// import '../../panels/ui_inspector/ui_inspector-meta.js';
// import '../../panels/cdp_debug/cdp_debug-meta.js';
// import '../../ui/components/linear_memory_inspector/linear_memory_inspector-meta.js';
import '../../ui/legacy/components/object_ui/object_ui-meta.js';
import '../../ui/legacy/components/perf_ui/perf_ui-meta.js';
import '../../ui/legacy/components/quick_open/quick_open-meta.js';
import '../../ui/legacy/components/source_frame/source_frame-meta.js';
import '../main/main-meta.js';
const env = decodeURIComponent(new URL(location.href).searchParams.get('env') || 'hippy');
if (env === "hippy" /* Hippy */ || env === "voltron" /* Voltron */) {
    import('../../panels/profiler/profiler-meta.js');
    import('../../ui/components/linear_memory_inspector/linear_memory_inspector-meta.js');
    import('../../panels/sources/sources-meta.js');
    import('../../ui/legacy/components/source_frame/source_frame-meta.js');
}
else if (env === "TDF" /* TDF */) {
    import('../../panels/core_memory/core_memory-meta.js');
    import('../../panels/profiler/profiler-meta.js');
    import('../../ui/components/linear_memory_inspector/linear_memory_inspector-meta.js');
    import('../../panels/sources/sources-meta.js');
    import('../../panels/ui_inspector/ui_inspector-meta.js');
    import('../../panels/cdp_debug/cdp_debug-meta.js');
    import('../../panels/core_performance/core_performance-meta.js');
    import('../../ui/legacy/components/source_frame/source_frame-meta.js');
}
else if (env === "TDFCore" /* TDFCore */) {
    import('../../panels/ui_inspector/ui_inspector-meta.js');
    import('../../panels/cdp_debug/cdp_debug-meta.js');
    import('../../panels/core_memory/core_memory-meta.js');
}
