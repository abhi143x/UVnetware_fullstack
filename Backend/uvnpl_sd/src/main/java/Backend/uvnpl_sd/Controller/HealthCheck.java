package Backend.uvnpl_sd.Controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthCheck {

    @GetMapping("healthcheck")
    public String healthcheck(){
        return "all is well";
    }
}
