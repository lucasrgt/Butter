# Worldline tests

This isolated Gradle 8.14.4 project runs Butter's Java 8 Worldline TestKit
0.3.1 consumer suite in host-only mode after the canonical Butter gate.

Until the tag-authorized plugin is public, publish the sibling Worldline
`tooling/gradle-plugin` project to Maven Local before running this suite.

Run `./gradlew worldlineDoctor worldlineTest` (or `gradlew.bat` on Windows).
