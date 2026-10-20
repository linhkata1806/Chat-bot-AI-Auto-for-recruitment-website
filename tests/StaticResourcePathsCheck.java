import java.nio.file.Files;
import java.nio.file.Path;
import org.springframework.boot.autoconfigure.security.servlet.PathRequest;
import org.springframework.boot.autoconfigure.web.servlet.DispatcherServletPath;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockServletContext;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.web.context.support.StaticWebApplicationContext;

// Isolated contract check: no RMS application, database, or security configuration is booted.
class StaticResourcePathsCheck {
    public static void main(String[] args) throws Exception {
        var servletContext = new MockServletContext();
        var context = new StaticWebApplicationContext();
        context.setServletContext(servletContext);
        context.getBeanFactory().registerSingleton("dispatcherServletPath", (DispatcherServletPath) () -> "/");
        context.refresh();
        servletContext.setAttribute(WebApplicationContext.ROOT_WEB_APPLICATION_CONTEXT_ATTRIBUTE, context);
        var matcher = PathRequest.toStaticResources().atCommonLocations();
        int checked = 0;
        try (var assets = Files.list(Path.of(args[0]))) {
            for (var asset : assets.filter(Files::isRegularFile).toList()) {
                var url = "/js/vendor/n8n-chat/1.42.6/" + asset.getFileName();
                var request = new MockHttpServletRequest(servletContext, "GET", url);
                request.setServletPath(url);
                if (!matcher.matches(request)) throw new AssertionError("Not a common static location: " + url);
                checked++;
            }
        }
        var oldUrl = "/vendor/n8n-chat/1.42.6/chat.bundle.es.js";
        var oldRequest = new MockHttpServletRequest(servletContext, "GET", oldUrl);
        oldRequest.setServletPath(oldUrl);
        if (matcher.matches(oldRequest)) throw new AssertionError("Unexpectedly public old vendor location");
        if (checked != 8) throw new AssertionError("Expected 8 vendor assets, found " + checked);
        context.close();
        System.out.println("PASS: " + checked + " vendor paths match the existing common-static matcher; old /vendor path is excluded.");
    }
}
