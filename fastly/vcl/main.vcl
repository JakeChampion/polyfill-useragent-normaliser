
include "normalise-user-agent.vcl";

sub vcl_recv {
	error 903 "Normalise User Agent";
}

sub vcl_error {
	if (obj.status == 903) {
        call normalise_user_agent_1_7_0;
		set obj.status = 200;
		set obj.response = "OK";
		set obj.http.Content-Type = "text/plain; charset=utf-8";
        set obj.http.normalized_user_agent_family = req.http.normalized_user_agent_family;
        set obj.http.normalized_user_agent_major_version = req.http.normalized_user_agent_major_version;
        set obj.http.normalized_user_agent_minor_version = req.http.normalized_user_agent_minor_version;
        set obj.http.normalized_user_agent_patch_version = req.http.normalized_user_agent_patch_version;
		set obj.http.Normalized-User-Agent = req.http.Normalized-User-Agent;
		synthetic req.http.Normalized-User-Agent;
		return (deliver);
	}
}