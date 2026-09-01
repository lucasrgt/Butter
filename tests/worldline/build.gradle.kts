plugins { id("io.github.lucasrgt.worldline.test") version "0.3.1" }

val verifyMod by tasks.registering(Exec::class) {
    workingDir("../..")
    commandLine("java", "tools/harness/Verify.java")
}

worldline {
    runtime.set("b1.7.3")
    oracleProfile.set("b173-local")
    noRuntime.set(true)
    productClasspath.from(provider {
        file("../../.butter/build/classes").listFiles()?.filter(File::isDirectory) ?: emptyList<File>()
    })
}

tasks.named("compileWorldlineTestJava") { dependsOn(verifyMod) }
