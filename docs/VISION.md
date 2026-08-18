# Butter Vision

Butter lets Beta 1.7.3 modders author screens as component trees instead of
coordinate-heavy `GuiScreen` code. A template describes structure, style,
bindings, and semantics. Java owns signals, actions, and domain integration.

The long-term shape is:

```text
.butter + .java -> compiler -> widget tree -> layout -> host/Minecraft pixels
                              -> semantic tree -> Worldline / agents / tests
```

Butter stays independently usable. Worldline consumes Butter semantics; it
does not own them. StationAPI may be integrated later and must never become
a requirement.
