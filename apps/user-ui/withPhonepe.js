const { withProjectBuildGradle } = require("@expo/config-plugins");

const withPhonePeRepository = (config) => {
  return withProjectBuildGradle(config, (mod) => {
    // Check if the maven repository already exists to prevent duplicates
    if (
      mod.modResults.contents.includes(
        "https://phonepe.mycloudrepo.io/public/repositories/phonepe-intentsdk-android"
      )
    ) {
      return mod;
    }

    // Use a regular expression to find the allprojects repositories block
    const allprojectsRegex = /allprojects\s*\{\s*repositories\s*\{/s;

    mod.modResults.contents = mod.modResults.contents.replace(
      allprojectsRegex,
      (match) => {
          return `${match}\n        maven { url "https://phonepe.mycloudrepo.io/public/repositories/phonepe-intentsdk-android" }`;
        }
    );

    return mod;
  });
};

module.exports = withPhonePeRepository;
