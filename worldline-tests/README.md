# Worldline TestKit consumer

Butter consumes the public Java 8 TestKit API JAR. It does not compile against
Worldline repository sources, Minecraft, RetroMCP, or the b1.7.3 adapter.

Build the experimental TestKit distribution in Worldline, point
`WORLDLINE_TESTKIT_HOME` at that generated directory, and run:

```text
java tools/testkit/Run.java
```

The Java 21 tool runs Butter's canonical gate, compiles the Java 8 specs, and
executes them with the packaged TestKit runner in host-only mode.
