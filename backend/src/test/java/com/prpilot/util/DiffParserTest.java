package com.prpilot.util;

import static org.assertj.core.api.Assertions.assertThat;

import com.prpilot.dto.FileChange;
import java.util.List;
import org.junit.jupiter.api.Test;

class DiffParserTest {

    private final DiffParser diffParser = new DiffParser();

    @Test
    void shouldParseGitStyleRawDiffIntoFileChanges() {
        String diff = """
                diff --git a/src/authMiddleware.ts b/src/authMiddleware.ts
                index 1111111..2222222 100644
                --- a/src/authMiddleware.ts
                +++ b/src/authMiddleware.ts
                @@ -1,4 +1,5 @@
                - validatePermission(user)
                + console.log(token)
                + // TODO: tighten validation
                  return user
                diff --git a/src/config.ts b/src/config.ts
                index 3333333..4444444 100644
                --- a/src/config.ts
                +++ b/src/config.ts
                @@ -1,2 +1,3 @@
                + export const apiKey = 'FAKE_DEMO_SECRET_DO_NOT_USE'
                  export const environment = 'demo'
                """;

        List<FileChange> files = diffParser.parse(diff);

        assertThat(files).hasSize(2);
        assertThat(files.get(0).filename()).isEqualTo("src/authMiddleware.ts");
        assertThat(files.get(0).additions()).isEqualTo(2);
        assertThat(files.get(0).deletions()).isEqualTo(1);
        assertThat(files.get(1).filename()).isEqualTo("src/config.ts");
        assertThat(files.get(1).additions()).isEqualTo(1);
    }

    @Test
    void shouldHandlePlainPatchWithoutDiffHeader() {
        List<FileChange> files = diffParser.parse("@@\n+ const value = true\n");

        assertThat(files).hasSize(1);
        assertThat(files.get(0).filename()).isEqualTo("raw-diff.patch");
        assertThat(files.get(0).additions()).isEqualTo(1);
    }
}
